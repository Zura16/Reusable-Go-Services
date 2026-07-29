package observability

import (
	"context"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/stdout/stdouttrace"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
)

// TracerConfig configures OpenTelemetry tracing.
type TracerConfig struct {
	ServiceName    string
	ServiceVersion string
	Environment    string
	SampleRate     float64
	EnableStdout   bool
}

// DefaultTracerConfig returns tracer configuration defaults.
func DefaultTracerConfig(serviceName string) TracerConfig {
	return TracerConfig{
		ServiceName:    serviceName,
		ServiceVersion: "0.1.0",
		Environment:    "development",
		SampleRate:     1.0,
		EnableStdout:   true,
	}
}

// InitTracer initializes OpenTelemetry tracing with W3C TraceContext propagation and configurable sampling.
func InitTracer(serviceName string, opts ...func(*TracerConfig)) (*sdktrace.TracerProvider, error) {
	cfg := DefaultTracerConfig(serviceName)
	for _, opt := range opts {
		opt(&cfg)
	}

	// Set global W3C TraceContext and Baggage propagators for distributed tracing
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	res, err := resource.Merge(
		resource.Default(),
		resource.NewWithAttributes(
			resource.Default().SchemaURL(),
			attribute.String("service.name", cfg.ServiceName),
			attribute.String("service.version", cfg.ServiceVersion),
			attribute.String("deployment.environment", cfg.Environment),
		),
	)
	if err != nil {
		return nil, err
	}

	var providerOpts []sdktrace.TracerProviderOption
	providerOpts = append(providerOpts, sdktrace.WithResource(res))

	if cfg.SampleRate < 1.0 {
		providerOpts = append(providerOpts, sdktrace.WithSampler(sdktrace.ParentBased(sdktrace.TraceIDRatioBased(cfg.SampleRate))))
	} else {
		providerOpts = append(providerOpts, sdktrace.WithSampler(sdktrace.AlwaysSample()))
	}

	if cfg.EnableStdout {
		exporter, err := stdouttrace.New(stdouttrace.WithPrettyPrint())
		if err != nil {
			return nil, err
		}
		providerOpts = append(providerOpts, sdktrace.WithBatcher(exporter))
	}

	tp := sdktrace.NewTracerProvider(providerOpts...)
	otel.SetTracerProvider(tp)

	return tp, nil
}

// ShutdownTracer gracefully shuts down the provided tracer provider.
func ShutdownTracer(ctx context.Context, tp *sdktrace.TracerProvider) error {
	if tp == nil {
		return nil
	}
	return tp.Shutdown(ctx)
}

// LoggerFromContext extracts trace_id and span_id from the context span and attaches them to the Zap logger.
func LoggerFromContext(ctx context.Context, logger *zap.Logger) *zap.Logger {
	if logger == nil {
		logger = zap.NewNop()
	}
	span := trace.SpanFromContext(ctx)
	if !span.SpanContext().IsValid() {
		return logger
	}
	return logger.With(
		zap.String("trace_id", span.SpanContext().TraceID().String()),
		zap.String("span_id", span.SpanContext().SpanID().String()),
	)
}
