package observability

import (
	"net/http"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// Metrics contains the standard Prometheus metrics for HTTP and gRPC servers.
type Metrics struct {
	// HTTPRequestsTotal counts the total number of HTTP requests.
	HTTPRequestsTotal *prometheus.CounterVec
	
	// HTTPRequestDuration tracks the duration of HTTP requests in seconds.
	HTTPRequestDuration *prometheus.HistogramVec
	
	// GRPCRequestsTotal counts the total number of gRPC requests.
	GRPCRequestsTotal *prometheus.CounterVec
	
	// GRPCRequestDuration tracks the duration of gRPC requests in seconds.
	GRPCRequestDuration *prometheus.HistogramVec
}

// NewMetrics creates and registers all standard collectors for the service.
// If reg is nil, it uses prometheus.DefaultRegisterer.
func NewMetrics(reg prometheus.Registerer) *Metrics {
	if reg == nil {
		reg = prometheus.DefaultRegisterer
	}

	m := &Metrics{
		HTTPRequestsTotal: prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "http_requests_total",
				Help: "Total number of HTTP requests",
			},
			[]string{"method", "path", "status"},
		),
		HTTPRequestDuration: prometheus.NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "http_request_duration_seconds",
				Help:    "Duration of HTTP requests in seconds",
				Buckets: []float64{.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10},
			},
			[]string{"method", "path"},
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

	reg.MustRegister(m.HTTPRequestsTotal)
	reg.MustRegister(m.HTTPRequestDuration)
	reg.MustRegister(m.GRPCRequestsTotal)
	reg.MustRegister(m.GRPCRequestDuration)

	return m
}

// Handler returns a promhttp.Handler for the /metrics endpoint.
// It uses the default Gatherer.
func Handler() http.Handler {
	return promhttp.Handler()
}
