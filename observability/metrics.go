// Package observability provides structured logging, Prometheus metrics, and OpenTelemetry tracing.
package observability

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// Metrics contains the standard Prometheus metrics for HTTP and gRPC servers.
type Metrics struct {
	registerer prometheus.Registerer
	gatherer   prometheus.Gatherer

	// HTTPRequestsTotal counts the total number of HTTP requests.
	HTTPRequestsTotal *prometheus.CounterVec

	// HTTPRequestDuration tracks the duration of HTTP requests in seconds.
	HTTPRequestDuration *prometheus.HistogramVec

	// GRPCRequestsTotal counts the total number of gRPC requests.
	GRPCRequestsTotal *prometheus.CounterVec

	// GRPCRequestDuration tracks the duration of gRPC requests in seconds.
	GRPCRequestDuration *prometheus.HistogramVec
}

// NewMetrics creates and registers all standard collectors for the service cleanly.
// If reg is nil, it uses prometheus.DefaultRegisterer. If gatherer is nil, it uses prometheus.DefaultGatherer.
func NewMetrics(reg prometheus.Registerer, gatherer prometheus.Gatherer) (*Metrics, error) {
	if reg == nil {
		reg = prometheus.DefaultRegisterer
	}

	if gatherer == nil {
		if g, ok := reg.(prometheus.Gatherer); ok {
			gatherer = g
		} else {
			gatherer = prometheus.DefaultGatherer
		}
	}

	m := &Metrics{
		registerer: reg,
		gatherer:   gatherer,
		HTTPRequestsTotal: prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "http_requests_total",
				Help: "Total number of HTTP requests",
			},
			[]string{"method", "route", "status", "status_class"},
		),
		HTTPRequestDuration: prometheus.NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "http_request_duration_seconds",
				Help:    "Duration of HTTP requests in seconds",
				Buckets: []float64{.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10},
			},
			[]string{"method", "route"},
		),
		GRPCRequestsTotal: prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "grpc_requests_total",
				Help: "Total number of gRPC requests",
			},
			[]string{"method", "status"},
		),
		GRPCRequestDuration: prometheus.NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "grpc_request_duration_seconds",
				Help:    "Duration of gRPC requests in seconds",
			},
			[]string{"method"},
		),
	}

	collectors := []prometheus.Collector{
		m.HTTPRequestsTotal,
		m.HTTPRequestDuration,
		m.GRPCRequestsTotal,
		m.GRPCRequestDuration,
	}

	for _, collector := range collectors {
		if err := reg.Register(collector); err != nil {
			var alreadyReg prometheus.AlreadyRegisteredError
			if errors.As(err, &alreadyReg) {
				continue
			}
			return nil, fmt.Errorf("registering collector: %w", err)
		}
	}

	return m, nil
}

// Gatherer returns the prometheus.Gatherer associated with these metrics.
func (m *Metrics) Gatherer() prometheus.Gatherer {
	if m == nil || m.gatherer == nil {
		return prometheus.DefaultGatherer
	}
	return m.gatherer
}

// Handler returns a promhttp.Handler for the /metrics endpoint using the given Gatherer.
// If g is nil, it defaults to prometheus.DefaultGatherer.
func Handler(g prometheus.Gatherer) http.Handler {
	if g == nil {
		g = prometheus.DefaultGatherer
	}
	return promhttp.HandlerFor(g, promhttp.HandlerOpts{})
}

// StatusClass returns the HTTP status class string (e.g. "2xx", "4xx", "5xx") for a given status code.
func StatusClass(code int) string {
	switch {
	case code >= 100 && code < 200:
		return "1xx"
	case code >= 200 && code < 300:
		return "2xx"
	case code >= 300 && code < 400:
		return "3xx"
	case code >= 400 && code < 500:
		return "4xx"
	case code >= 500:
		return "5xx"
	default:
		return "unknown"
	}
}
