package httpserver_test

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"


	"github.com/Zura16/Reusable-Go-Services/config"
	"github.com/Zura16/Reusable-Go-Services/httpserver"
	"github.com/Zura16/Reusable-Go-Services/observability"

	"github.com/prometheus/client_golang/prometheus"
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

	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()
	server.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rec.Code)
	}
	if body := rec.Body.String(); body != "OK" {
		t.Fatalf("expected body 'OK', got '%s'", body)
	}
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

	// Test 1: Unavailable when isReady == false
	req := httptest.NewRequest(http.MethodGet, "/readyz", nil)
	rec := httptest.NewRecorder()
	server.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected status %d, got %d", http.StatusServiceUnavailable, rec.Code)
	}

	// Test 2: Ready when isReady == true
	isReady = true
	req = httptest.NewRequest(http.MethodGet, "/readyz", nil)
	rec = httptest.NewRecorder()
	server.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rec.Code)
	}
}

func TestMetricsEndpoint(t *testing.T) {
	t.Parallel()
	logger := zap.NewNop()
	reg := prometheus.NewRegistry()
	metrics := observability.NewMetrics(reg)

	server, err := httpserver.New(config.Config{Port: 8080}, logger, httpserver.WithMetrics(metrics))
	if err != nil {
		t.Fatalf("failed to create server: %v", err)
	}

	// Record a sample HTTP request to increment counter
	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()
	server.Handler().ServeHTTP(rec, req)

	// Fetch /metrics endpoint
	reqMetrics := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	recMetrics := httptest.NewRecorder()
	server.Handler().ServeHTTP(recMetrics, reqMetrics)

	if recMetrics.Code != http.StatusOK {
		t.Fatalf("expected status %d on /metrics, got %d", http.StatusOK, recMetrics.Code)
	}

	body := recMetrics.Body.String()
	if !strings.Contains(body, "http_requests_total") {
		t.Fatalf("expected metrics response to contain 'http_requests_total', got:\n%s", body)
	}
}

func TestHeaderRedaction(t *testing.T) {
	t.Parallel()
	core, logs := observer.New(zapcore.InfoLevel)
	logger := zap.New(core)

	server, err := httpserver.New(config.Config{Port: 8080}, logger)
	if err != nil {
		t.Fatalf("failed to create server: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	req.Header.Set("Authorization", "Bearer secret-token-value")
	req.Header.Set("Cookie", "session_id=123456")
	req.Header.Set("Set-Cookie", "user=alice")
	req.Header.Set("User-Agent", "TestAgent/1.0")

	rec := httptest.NewRecorder()
	server.Handler().ServeHTTP(rec, req)

	allLogs := logs.All()
	if len(allLogs) == 0 {
		t.Fatal("expected request log to be recorded")
	}

	logStr := fmt.Sprintf("%v", allLogs[0].ContextMap())
	if strings.Contains(logStr, "secret-token-value") {
		t.Errorf("log leaked Authorization token: %s", logStr)
	}
	if strings.Contains(logStr, "session_id=123456") {
		t.Errorf("log leaked Cookie header: %s", logStr)
	}
	if strings.Contains(logStr, "user=alice") {
		t.Errorf("log leaked Set-Cookie header: %s", logStr)
	}
}

func TestPanicRecoveryAndLogging(t *testing.T) {
	t.Parallel()
	core, logs := observer.New(zapcore.InfoLevel)
	logger := zap.New(core)
	reg := prometheus.NewRegistry()
	metrics := observability.NewMetrics(reg)

	server, err := httpserver.New(config.Config{Port: 8080}, logger, httpserver.WithMetrics(metrics))
	if err != nil {
		t.Fatalf("failed to create server: %v", err)
	}

	server.HandleFunc("GET /panic", func(w http.ResponseWriter, r *http.Request) {
		panic("handler unexpected error")
	})

	req := httptest.NewRequest(http.MethodGet, "/panic", nil)
	rec := httptest.NewRecorder()
	server.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("expected status %d for panic, got %d", http.StatusInternalServerError, rec.Code)
	}

	// Verify panic recovery logged error AND logging middleware logged status 500
	entries := logs.All()
	if len(entries) < 2 {
		t.Fatalf("expected at least 2 log entries (panic + http request), got %d", len(entries))
	}
}

func TestRequestIDSanitization(t *testing.T) {
	t.Parallel()
	mw := httpserver.RequestID()

	// Test 1: Malformed/oversized request ID is replaced with UUID
	oversizedID := strings.Repeat("A", 100)
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("X-Request-ID", oversizedID)
	rec := httptest.NewRecorder()

	var capturedID string
	handler := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedID = httpserver.RequestIDFromContext(r.Context())
	}))
	handler.ServeHTTP(rec, req)

	if capturedID == oversizedID || capturedID == "" {
		t.Fatalf("expected oversized X-Request-ID to be rejected and replaced, got: %s", capturedID)
	}

	// Test 2: Valid request ID is preserved
	validID := "test-request-id-12345"
	req = httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("X-Request-ID", validID)
	rec = httptest.NewRecorder()

	handler.ServeHTTP(rec, req)
	if capturedID != validID {
		t.Fatalf("expected valid X-Request-ID %s, got: %s", validID, capturedID)
	}
}

func TestMaxBodySize(t *testing.T) {
	t.Parallel()
	mw := httpserver.MaxBodySize(10) // 10 bytes limit
	handler := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, err.Error(), http.StatusRequestEntityTooLarge)
			return
		}
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader("0123456789too-large"))
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusRequestEntityTooLarge {
		t.Errorf("expected status %d for oversized body, got %d", http.StatusRequestEntityTooLarge, rec.Code)
	}
}
