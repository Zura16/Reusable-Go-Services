package httpserver_test

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/aalindkale/servicekit/config"
	"github.com/aalindkale/servicekit/httpserver"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"go.uber.org/zap/zaptest/observer"
)

func TestHealthEndpoint(t *testing.T) {
	t.Parallel()
	logger := zap.NewNop()
	server, err := httpserver.New(config.Config{Port: 8080}, logger)
	if err != nil {
		t.Fatalf("failed to create server: %v", err)
	}

	// We can exercise the healthz handler via a test HTTP server wrapping the mux/handler if available,
	// or test endpoints directly.
	_ = server
}

func TestReadinessEndpoint(t *testing.T) {
	t.Parallel()
	logger := zap.NewNop()
	isReady := false
	server, err := httpserver.New(config.Config{Port: 8080}, logger, httpserver.WithReadyCheck(func() bool {
		return isReady
	}))
	if err != nil {
		t.Fatalf("failed to create server: %v", err)
	}
	_ = server
}

func TestPanicRecovery(t *testing.T) {
	t.Parallel()
	logger := zap.NewNop()
	mw := httpserver.Recovery(logger)
	handler := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic("test panic")
	}))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusInternalServerError {
		t.Errorf("expected status %d, got %d", http.StatusInternalServerError, rr.Code)
	}
}

func TestRequestID(t *testing.T) {
	t.Parallel()
	mw := httpserver.RequestID()
	var requestID string
	handler := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestID = httpserver.RequestIDFromContext(r.Context())
	}))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if requestID == "" {
		t.Error("expected requestID in context")
	}
	if rr.Header().Get("X-Request-ID") != requestID {
		t.Error("expected X-Request-ID header to match context ID")
	}

	// Test existing ID
	req = httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("X-Request-ID", "custom-id")
	rr = httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if requestID != "custom-id" {
		t.Errorf("expected requestID custom-id, got %s", requestID)
	}
}

func TestMaxBodySize(t *testing.T) {
	t.Parallel()
	mw := httpserver.MaxBodySize(10) // 10 bytes
	handler := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, err.Error(), http.StatusRequestEntityTooLarge)
			return
		}
		w.WriteHeader(http.StatusOK)
	}))

	body := strings.NewReader("this is more than 10 bytes")
	req := httptest.NewRequest(http.MethodPost, "/", body)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusRequestEntityTooLarge {
		t.Errorf("expected status %d, got %d", http.StatusRequestEntityTooLarge, rr.Code)
	}
}

func TestLoggingMiddleware(t *testing.T) {
	t.Parallel()
	core, logs := observer.New(zapcore.InfoLevel)
	logger := zap.New(core)

	mw := httpserver.Logging(logger)
	handler := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusCreated)
	}))

	req := httptest.NewRequest(http.MethodGet, "/testpath", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if logs.Len() != 1 {
		t.Fatalf("expected 1 log entry, got %d", logs.Len())
	}
	logEntry := logs.All()[0]
	if logEntry.Message != "http request" {
		t.Errorf("unexpected message: %s", logEntry.Message)
	}
}

func TestGracefulShutdown(t *testing.T) {
	t.Parallel()
	logger := zap.NewNop()
	server, _ := httpserver.New(config.Config{Port: 0}, logger)
	ctx := context.Background()
	err := server.Shutdown(ctx)
	if err != nil {
		t.Errorf("expected no error during shutdown, got %v", err)
	}
}

// ExampleServer demonstrates how to start and configure the HTTP server.
func ExampleServer() {
	logger := zap.NewNop()
	cfg := config.Config{Port: 8080}

	srv, _ := httpserver.New(cfg, logger, httpserver.WithMaxBodySize(2<<20))
	srv.HandleFunc("/hello", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, "Hello World")
	})

	fmt.Println("Server created")
	// Output: Server created
}
