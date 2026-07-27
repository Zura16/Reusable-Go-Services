// Package httpserver provides an HTTP server with health checks, readiness probes, metrics, and middleware.
package httpserver

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/aalindkale/servicekit/config"
	"github.com/aalindkale/servicekit/observability"
	"go.uber.org/zap"
)

// Option configures the HTTP server.
type Option func(*Server)

// Server represents the HTTP server instance.
type Server struct {
	httpServer  *http.Server
	logger      *zap.Logger
	mux         *http.ServeMux
	metrics     *observability.Metrics
	readyCheck  func() bool
	maxBodySize int64
	middleware  []func(http.Handler) http.Handler
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

// WithMiddleware appends custom middleware to the server's chain.
func WithMiddleware(mw ...func(http.Handler) http.Handler) Option {
	return func(s *Server) {
		s.middleware = append(s.middleware, mw...)
	}
}

// New creates a new HTTP server configured with standard routes and middleware.
func New(cfg config.Config, logger *zap.Logger, opts ...Option) (*Server, error) {
	s := &Server{
		logger:      logger,
		mux:         http.NewServeMux(),
		maxBodySize: 1 << 20, // Default 1MB
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

	// Setup metrics route
	s.mux.Handle("/metrics", observability.Handler())

	// Build the complete middleware chain
	var mwChain []func(http.Handler) http.Handler
	mwChain = append(mwChain, Recovery(logger))
	mwChain = append(mwChain, RequestID())
	mwChain = append(mwChain, Logging(logger))
	if s.metrics != nil {
		mwChain = append(mwChain, Metrics(s.metrics))
	}
	mwChain = append(mwChain, MaxBodySize(s.maxBodySize))

	// Add any user-supplied middleware
	mwChain = append(mwChain, s.middleware...)

	// Wrap the multiplexer
	var handler http.Handler = s.mux
	for i := len(mwChain) - 1; i >= 0; i-- {
		handler = mwChain[i](handler)
	}

	s.httpServer = &http.Server{
		Addr:         ":" + strconv.Itoa(cfg.Port),
		Handler:      handler,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	return s, nil
}

// ListenAndServe starts the HTTP server to begin accepting requests.
func (s *Server) ListenAndServe() error {
	s.logger.Info("starting http server", zap.String("addr", s.httpServer.Addr))
	return s.httpServer.ListenAndServe()
}

// Shutdown gracefully shuts down the server.
func (s *Server) Shutdown(ctx context.Context) error {
	s.logger.Info("shutting down http server")
	return s.httpServer.Shutdown(ctx)
}

// Handle registers a standard http.Handler for the specified pattern.
func (s *Server) Handle(pattern string, handler http.Handler) {
	s.mux.Handle(pattern, handler)
}

// HandleFunc registers a handler function for the specified pattern.
func (s *Server) HandleFunc(pattern string, handler http.HandlerFunc) {
	s.mux.HandleFunc(pattern, handler)
}
