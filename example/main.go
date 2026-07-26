// Package main provides a complete example of using servicekit to run
// both HTTP and gRPC servers with authentication, observability, and
// graceful shutdown.
//
// Run with:
//
//	SERVICEKIT_AUTH_TOKEN=secret go run ./example/
//
// Then try:
//
//	curl http://localhost:8080/healthz
//	curl http://localhost:8080/readyz
//	curl http://localhost:8080/metrics
//	curl -H "Authorization: Bearer secret" http://localhost:8080/api/hello
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/aalindkale/servicekit/auth"
	"github.com/aalindkale/servicekit/config"
	"github.com/aalindkale/servicekit/grpcserver"
	"github.com/aalindkale/servicekit/httpclient"
	"github.com/aalindkale/servicekit/httpserver"
	"github.com/aalindkale/servicekit/observability"
	profilev1 "github.com/aalindkale/servicekit/proto/profile/v1"
	"github.com/prometheus/client_golang/prometheus"
	"go.uber.org/zap"
)

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}

func run() error {
	// ── 1. Load and validate configuration ──────────────────────────────
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("loading config: %w", err)
	}

	// ── 2. Initialize observability ─────────────────────────────────────
	logger, err := observability.NewLogger(cfg.LogLevel)
	if err != nil {
		return fmt.Errorf("creating logger: %w", err)
	}
	defer logger.Sync()

	logger.Info("configuration loaded", zap.Stringer("config", cfg))

	// Initialize tracing
	tp, err := observability.InitTracer("servicekit-example")
	if err != nil {
		return fmt.Errorf("initializing tracer: %w", err)
	}
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := observability.ShutdownTracer(ctx, tp); err != nil {
			logger.Error("shutting down tracer", zap.Error(err))
		}
	}()

	// Initialize metrics with a custom registry to avoid conflicts
	reg := prometheus.NewRegistry()
	metrics := observability.NewMetrics(reg)

	// ── 3. Set up authentication ────────────────────────────────────────
	var validator auth.TokenValidator
	if cfg.AuthToken != "" {
		validator = auth.NewStaticValidator(cfg.AuthToken, auth.Identity{
			Subject: "api-user",
			Roles:   []string{"user"},
		})
		logger.Info("authentication enabled with static token validator")
	} else {
		// In dev mode without a token, use a mock that always succeeds
		validator = &auth.MockValidator{
			Identity: auth.Identity{Subject: "dev-user", Roles: []string{"admin", "user"}},
		}
		logger.Warn("no auth token configured, using mock validator (dev mode)")
	}

	// ── 4. Create HTTP client (demonstrates the httpclient package) ─────
	client := httpclient.New(
		httpclient.WithTimeout(10*time.Second),
		httpclient.WithLogger(logger.Named("httpclient")),
	)

	// ── 5. Start HTTP server ────────────────────────────────────────────
	ready := true
	httpSrv, err := httpserver.New(cfg, logger.Named("http"),
		httpserver.WithMetrics(metrics),
		httpserver.WithReadyCheck(func() bool { return ready }),
		httpserver.WithMaxBodySize(5<<20), // 5MB
	)
	if err != nil {
		return fmt.Errorf("creating http server: %w", err)
	}

	// Register application routes
	httpSrv.Handle("GET /api/hello", auth.HTTPMiddleware(validator)(
		http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			identity, ok := auth.IdentityFromContext(r.Context())
			if !ok {
				http.Error(w, "no identity in context", http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"message": "Hello from ServiceKit!",
				"user":    identity.Subject,
				"roles":   identity.Roles,
			})
		}),
	))

	// An example route that uses the HTTP client
	httpSrv.HandleFunc("GET /api/client-demo", func(w http.ResponseWriter, r *http.Request) {
		// Demonstrate using the HTTP client with context propagation
		resp, err := client.Get(r.Context(), "http://localhost:"+fmt.Sprint(cfg.Port)+"/healthz")
		if err != nil {
			http.Error(w, fmt.Sprintf("client request failed: %v", err), http.StatusBadGateway)
			return
		}
		defer resp.Body.Close()

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message":       "HTTP client round-trip successful",
			"upstream_code": resp.StatusCode,
		})
	})

	// ── 6. Start gRPC server ────────────────────────────────────────────
	grpcSrv, err := grpcserver.New(cfg, logger.Named("grpc"), validator, metrics,
		grpcserver.WithReflection(),
	)
	if err != nil {
		return fmt.Errorf("creating grpc server: %w", err)
	}

	// Register the example ProfileService
	profileServer := grpcserver.NewProfileServer()
	profilev1.RegisterProfileServiceServer(grpcSrv.Server(), profileServer)

	// ── 7. Start servers in goroutines ──────────────────────────────────
	errCh := make(chan error, 2)

	go func() {
		if err := httpSrv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errCh <- fmt.Errorf("http server: %w", err)
		}
	}()

	go func() {
		if err := grpcSrv.Serve(); err != nil {
			errCh <- fmt.Errorf("grpc server: %w", err)
		}
	}()

	logger.Info("servicekit example started",
		zap.Int("http_port", cfg.Port),
		zap.Int("grpc_port", cfg.GRPCPort),
	)

	// ── 8. Wait for shutdown signal ─────────────────────────────────────
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case sig := <-quit:
		logger.Info("received shutdown signal", zap.String("signal", sig.String()))
	case err := <-errCh:
		logger.Error("server error", zap.Error(err))
		return err
	}

	// ── 9. Graceful shutdown ────────────────────────────────────────────
	ctx, cancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
	defer cancel()

	logger.Info("initiating graceful shutdown", zap.Duration("timeout", cfg.ShutdownTimeout))

	// Stop accepting new connections
	grpcSrv.GracefulStop()

	if err := httpSrv.Shutdown(ctx); err != nil {
		return fmt.Errorf("http server shutdown: %w", err)
	}

	logger.Info("shutdown complete")
	return nil
}
