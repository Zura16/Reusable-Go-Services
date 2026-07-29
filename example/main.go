package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"sync/atomic"
	"syscall"
	"time"

	"github.com/Zura16/Reusable-Go-Services/auth"
	"github.com/Zura16/Reusable-Go-Services/config"
	"github.com/Zura16/Reusable-Go-Services/grpcserver"
	"github.com/Zura16/Reusable-Go-Services/httpclient"
	"github.com/Zura16/Reusable-Go-Services/httpserver"
	"github.com/Zura16/Reusable-Go-Services/observability"
	profilev1 "github.com/Zura16/Reusable-Go-Services/proto/profile/v1"

	"github.com/prometheus/client_golang/prometheus"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "service exit error: %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	// 1. Load Configuration
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("loading config: %w", err)
	}

	// 2. Initialize Structured Logger
	logger, err := observability.NewLogger(cfg.LogLevel)
	if err != nil {
		return fmt.Errorf("initializing logger: %w", err)
	}
	defer func() { _ = logger.Sync() }()

	logger.Info("starting servicekit example service",
		zap.Int("http_port", cfg.Port),
		zap.Int("grpc_port", cfg.GRPCPort),
		zap.Int("metrics_port", cfg.MetricsPort),
	)

	// 3. Initialize OpenTelemetry Tracing with W3C propagation
	tp, err := observability.InitTracer("servicekit-example")
	if err != nil {
		return fmt.Errorf("initializing tracer: %w", err)
	}
	defer func() {
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = observability.ShutdownTracer(shutdownCtx, tp)
	}()

	// 4. Initialize Prometheus Metrics cleanly
	reg := prometheus.NewRegistry()
	metrics, err := observability.NewMetrics(reg, reg)
	if err != nil {
		return fmt.Errorf("initializing metrics: %w", err)
	}

	// 5. Initialize Authentication Validator (defaults to dev token if environment variable is empty)
	var validator auth.TokenValidator
	if cfg.AuthToken != "" {
		validator = auth.NewStaticValidator(cfg.AuthToken, auth.Identity{
			Subject: "example-admin",
			Roles:   []string{"admin", "user"},
		})
	} else {
		validator = auth.NewStaticValidator("dev-token", auth.Identity{
			Subject: "dev-user",
			Roles:   []string{"admin", "user"},
		})
	}

	// Dynamic readiness state
	var isReady int32 = 1

	// 6. Initialize HTTP Server
	httpSrv, err := httpserver.New(cfg, logger,
		httpserver.WithMetrics(metrics),
		httpserver.WithReadyCheck(func() bool {
			return atomic.LoadInt32(&isReady) == 1
		}),
	)
	if err != nil {
		return fmt.Errorf("creating http server: %w", err)
	}

	// Protected HTTP handler wrapped explicitly with auth middleware
	protectedHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id, ok := auth.IdentityFromContext(r.Context())
		if !ok {
			http.Error(w, "unauthenticated", http.StatusUnauthorized)
			return
		}
		_, _ = fmt.Fprintf(w, "Hello %s! Roles: %v\n", id.Subject, id.Roles)
	})

	httpSrv.Handle("GET /api/v1/protected", auth.HTTPMiddleware(validator)(protectedHandler))

	httpSrv.Handle("GET /api/v1/admin", auth.HTTPMiddleware(validator)(
		auth.RequireRole("admin")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			_, _ = w.Write([]byte("Welcome Admin!"))
		})),
	))

	// 7. Initialize gRPC Server with explicit authentication mode
	grpcSrv, err := grpcserver.New(cfg, logger, validator, metrics,
		grpcserver.WithReflection(),
		grpcserver.WithAuthentication(validator),
	)
	if err != nil {
		return fmt.Errorf("creating grpc server: %w", err)
	}
	profilev1.RegisterProfileServiceServer(grpcSrv.Server(), grpcserver.NewProfileServer())

	// 8. Initialize HTTP Client
	client := httpclient.New(
		httpclient.WithTimeout(5*time.Second),
		httpclient.WithLogger(logger),
	)
	defer client.CloseIdleConnections()

	// 9. Coordinate Concurrency and Bounded Graceful Shutdown
	rootCtx, stopSignal := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stopSignal()

	g, gCtx := errgroup.WithContext(rootCtx)

	// Start HTTP Server (and automatic dedicated metrics server on MetricsPort if configured)
	g.Go(func() error {
		if err := httpSrv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			return fmt.Errorf("http server error: %w", err)
		}
		return nil
	})

	// Start gRPC Server
	g.Go(func() error {
		if err := grpcSrv.Serve(); err != nil {
			return fmt.Errorf("grpc server error: %w", err)
		}
		return nil
	})

	// Wait for termination signal or server error
	g.Go(func() error {
		<-gCtx.Done()
		logger.Info("shutdown signal received, initiating coordinated shutdown")

		// Mark readiness false immediately so load balancers stop sending traffic
		atomic.StoreInt32(&isReady, 0)

		shutdownTimeout := cfg.ShutdownTimeout
		if shutdownTimeout <= 0 {
			shutdownTimeout = 15 * time.Second
		}
		shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
		defer cancel()

		var shutdownGroup errgroup.Group

		// Shutdown HTTP Server
		shutdownGroup.Go(func() error {
			return httpSrv.Shutdown(shutdownCtx)
		})

		// Gracefully Stop gRPC Server with timed fallback to forced Stop()
		shutdownGroup.Go(func() error {
			stopped := make(chan struct{})
			go func() {
				grpcSrv.GracefulStop()
				close(stopped)
			}()

			select {
			case <-stopped:
				logger.Info("gRPC server stopped gracefully")
			case <-shutdownCtx.Done():
				logger.Warn("gRPC graceful shutdown timed out, forcing stop")
				grpcSrv.Stop()
			}
			return nil
		})

		return shutdownGroup.Wait()
	})

	return g.Wait()
}
