// Package httpserver provides an HTTP server with health checks, readiness probes, metrics, and middleware.
package httpserver

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/http"
	"strconv"
	"time"

	"github.com/Zura16/Reusable-Go-Services/config"
	"github.com/Zura16/Reusable-Go-Services/observability"

	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"
)

// Option configures the HTTP server.
type Option func(*Server)

// Server represents the HTTP server instance.
type Server struct {
	httpServer        *http.Server
	metricsServer     *http.Server
	logger            *zap.Logger
	mux               *http.ServeMux
	handler           http.Handler
	metrics           *observability.Metrics
	readyCheck        func() bool
	maxBodySize       int64
	readHeaderTimeout time.Duration
	maxHeaderBytes    int
	addr              string
	metricsAddr       string
	middleware        []func(http.Handler) http.Handler
}

// WithMetrics enables Prometheus metrics using the provided Metrics instance.
func WithMetrics(m *observability.Metrics) Option {
	return func(s *Server) {
		s.metrics = m
	}
}

// WithReadyCheck sets a readiness check function for the /readyz endpoint.
func WithReadyCheck(fn func() bool) Option {
	return func(s *Server) {
		s.readyCheck = fn
	}
}

// WithMaxBodySize sets the maximum allowed size for request bodies.
func WithMaxBodySize(n int64) Option {
	return func(s *Server) {
		s.maxBodySize = n
	}
}

// WithAddr overrides the main server bind address (e.g. "127.0.0.1:8080").
func WithAddr(addr string) Option {
	return func(s *Server) {
		s.addr = addr
	}
}

// WithReadHeaderTimeout sets the ReadHeaderTimeout on http.Server.
func WithReadHeaderTimeout(d time.Duration) Option {
	return func(s *Server) {
		s.readHeaderTimeout = d
	}
}

// WithMaxHeaderBytes sets the MaxHeaderBytes on http.Server.
func WithMaxHeaderBytes(n int) Option {
	return func(s *Server) {
		s.maxHeaderBytes = n
	}
}

// WithMiddleware appends custom middleware to the server's chain.
func WithMiddleware(mw ...func(http.Handler) http.Handler) Option {
	return func(s *Server) {
		s.middleware = append(s.middleware, mw...)
	}
}

// New creates a new HTTP server configured with standard routes, metrics gatherer, and middleware.
func New(cfg config.Config, logger *zap.Logger, opts ...Option) (*Server, error) {
	if logger == nil {
		logger = zap.NewNop()
	}

	s := &Server{
		logger:            logger,
		mux:               http.NewServeMux(),
		maxBodySize:       1 << 20, // Default 1MB
		readHeaderTimeout: 5 * time.Second,
		maxHeaderBytes:    1 << 20, // Default 1MB
		addr:              ":" + strconv.Itoa(cfg.Port),
	}

	if cfg.MetricsPort > 0 && cfg.MetricsPort != cfg.Port {
		s.metricsAddr = ":" + strconv.Itoa(cfg.MetricsPort)
	}

	for _, opt := range opts {
		opt(s)
	}

	// Register built-in health routes
	s.mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("OK"))
	})

	s.mux.HandleFunc("/readyz", func(w http.ResponseWriter, r *http.Request) {
		if s.readyCheck != nil && !s.readyCheck() {
			w.WriteHeader(http.StatusServiceUnavailable)
			_, _ = w.Write([]byte("Unavailable"))
			return
		}
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("Ready"))
	})

	// Register /metrics ONLY on main mux if no separate metrics port is configured
	if s.metricsAddr == "" {
		s.mux.Handle("/metrics", observability.Handler(s.metrics.Gatherer()))
	} else {
		metricsMux := http.NewServeMux()
		metricsMux.Handle("/metrics", observability.Handler(s.metrics.Gatherer()))
		s.metricsServer = &http.Server{
			Addr:              s.metricsAddr,
			Handler:           metricsMux,
			ReadHeaderTimeout: 5 * time.Second,
			WriteTimeout:      10 * time.Second,
		}
	}

	// Build the middleware chain.
	// Order: RequestID -> Logging -> Metrics -> Recovery -> MaxBodySize -> User Middleware -> Mux
	var mwChain []func(http.Handler) http.Handler
	mwChain = append(mwChain, RequestID())
	mwChain = append(mwChain, Logging(logger))
	if s.metrics != nil {
		mwChain = append(mwChain, Metrics(s.metrics))
	}
	mwChain = append(mwChain, Recovery(logger))
	mwChain = append(mwChain, MaxBodySize(s.maxBodySize))
	mwChain = append(mwChain, s.middleware...)

	// Wrap the multiplexer
	var handler http.Handler = s.mux
	for i := len(mwChain) - 1; i >= 0; i-- {
		handler = mwChain[i](handler)
	}
	s.handler = handler

	s.httpServer = &http.Server{
		Addr:              s.addr,
		Handler:           s.handler,
		ReadTimeout:       5 * time.Second,
		ReadHeaderTimeout: s.readHeaderTimeout,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       120 * time.Second,
		MaxHeaderBytes:    s.maxHeaderBytes,
	}

	return s, nil
}

// Handler returns the composed http.Handler containing all middleware and routes.
func (s *Server) Handler() http.Handler {
	return s.handler
}

// ListenAndServe starts the HTTP server (and dedicated metrics server if configured) to begin accepting requests.
// Creates network listeners synchronously so binding failures on either port trigger immediate error return.
// Supervises both servers so an unexpected failure of either server triggers coordinated shutdown of the sibling.
func (s *Server) ListenAndServe() error {
	mainLis, err := net.Listen("tcp", s.httpServer.Addr)
	if err != nil {
		return fmt.Errorf("opening http listener on %s: %w", s.httpServer.Addr, err)
	}
	defer func() { _ = mainLis.Close() }()

	var metricsLis net.Listener
	if s.metricsServer != nil {
		metricsLis, err = net.Listen("tcp", s.metricsServer.Addr)
		if err != nil {
			return fmt.Errorf("opening metrics listener on %s: %w", s.metricsServer.Addr, err)
		}
		defer func() { _ = metricsLis.Close() }()
	}

	g, gCtx := errgroup.WithContext(context.Background())

	if metricsLis != nil {
		g.Go(func() error {
			s.logger.Info("starting dedicated metrics server", zap.String("addr", s.metricsServer.Addr))
			serveErr := s.metricsServer.Serve(metricsLis)
			if serveErr != nil && !errors.Is(serveErr, http.ErrServerClosed) {
				shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
				defer cancel()
				_ = s.httpServer.Shutdown(shutdownCtx)
				return fmt.Errorf("metrics server error: %w", serveErr)
			}
			return nil
		})
	}

	g.Go(func() error {
		s.logger.Info("starting http server", zap.String("addr", s.httpServer.Addr))
		serveErr := s.httpServer.Serve(mainLis)
		if serveErr != nil && !errors.Is(serveErr, http.ErrServerClosed) {
			if s.metricsServer != nil {
				shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
				defer cancel()
				_ = s.metricsServer.Shutdown(shutdownCtx)
			}
			return fmt.Errorf("http server error: %w", serveErr)
		}
		return nil
	})

	go func() {
		<-gCtx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if s.metricsServer != nil {
			_ = s.metricsServer.Shutdown(shutdownCtx)
		}
		_ = s.httpServer.Shutdown(shutdownCtx)
	}()

	return g.Wait()
}

// Shutdown gracefully shuts down the HTTP server and dedicated metrics server concurrently.
func (s *Server) Shutdown(ctx context.Context) error {
	s.logger.Info("shutting down http server")
	var g errgroup.Group

	if s.metricsServer != nil {
		g.Go(func() error {
			return s.metricsServer.Shutdown(ctx)
		})
	}

	g.Go(func() error {
		return s.httpServer.Shutdown(ctx)
	})

	return g.Wait()
}

// Handle registers a standard http.Handler for the specified pattern.
func (s *Server) Handle(pattern string, handler http.Handler) {
	s.mux.Handle(pattern, handler)
}

// HandleFunc registers a handler function for the specified pattern.
func (s *Server) HandleFunc(pattern string, handler http.HandlerFunc) {
	s.mux.HandleFunc(pattern, handler)
}
