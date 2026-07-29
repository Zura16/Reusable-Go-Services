package observability_test

import (
	"context"
	"testing"
	"time"

	"github.com/Zura16/Reusable-Go-Services/observability"
	"github.com/prometheus/client_golang/prometheus"
	"go.uber.org/zap"
)

func TestNewLogger(t *testing.T) {
	t.Parallel()

	logger, err := observability.NewLogger("info")
	if err != nil {
		t.Fatalf("failed to create logger: %v", err)
	}
	if logger == nil {
		t.Fatal("expected non-nil logger")
	}

	_, err = observability.NewLogger("invalid_level")
	if err == nil {
		t.Fatal("expected error for invalid log level")
	}
}

func TestRedactHeaders(t *testing.T) {
	t.Parallel()

	headers := map[string][]string{
		"Authorization": {"Bearer secret"},
		"Cookie":        {"session=123"},
		"Set-Cookie":    {"user=alice"},
		"X-Custom":      {"custom-val"},
	}

	redacted := observability.RedactHeaders(headers)
	if redacted["Authorization"] != "[REDACTED]" {
		t.Errorf("expected Authorization redacted, got %s", redacted["Authorization"])
	}
	if redacted["Cookie"] != "[REDACTED]" {
		t.Errorf("expected Cookie redacted, got %s", redacted["Cookie"])
	}
	if redacted["Set-Cookie"] != "[REDACTED]" {
		t.Errorf("expected Set-Cookie redacted, got %s", redacted["Set-Cookie"])
	}
	if redacted["X-Custom"] != "custom-val" {
		t.Errorf("expected X-Custom preserved, got %s", redacted["X-Custom"])
	}
}

func TestInitTracerAndLoggerFromContext(t *testing.T) {
	t.Parallel()

	tp, err := observability.InitTracer("test-service", func(cfg *observability.TracerConfig) {
		cfg.EnableStdout = false
	})
	if err != nil {
		t.Fatalf("failed to init tracer: %v", err)
	}
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		_ = observability.ShutdownTracer(ctx, tp)
	}()

	logger := zap.NewNop()
	ctxLogger := observability.LoggerFromContext(context.Background(), logger)
	if ctxLogger == nil {
		t.Fatal("expected non-nil logger from context")
	}
}

func TestMetricsAndGatherer(t *testing.T) {
	t.Parallel()

	reg := prometheus.NewRegistry()
	m, err := observability.NewMetrics(reg)
	if err != nil {
		t.Fatalf("unexpected error creating metrics: %v", err)
	}
	if m == nil {
		t.Fatal("expected non-nil metrics")
	}
	if m.Gatherer() == nil {
		t.Fatal("expected non-nil gatherer")
	}

	handler := observability.Handler(m.Gatherer())
	if handler == nil {
		t.Fatal("expected non-nil handler")
	}
}

