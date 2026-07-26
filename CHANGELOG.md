# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-07-24

### Added

- **config**: Typed configuration with environment variable loading, safe defaults, validation, and secret redaction.
- **observability/logging**: Structured JSON logging via `zap` with configurable levels and header redaction.
- **observability/metrics**: Prometheus metrics for HTTP and gRPC (request counters, duration histograms).
- **observability/tracing**: OpenTelemetry tracing with stdout exporter for development.
- **auth**: Token validation interface with `StaticValidator` (constant-time comparison) and `MockValidator` for testing.
- **auth**: HTTP middleware for bearer token authentication and role-based authorization.
- **httpserver**: Production-ready HTTP server with health/readiness probes, graceful shutdown, and middleware chain (recovery, request ID, logging, metrics, tracing, body size limits).
- **httpclient**: Context-aware HTTP client with connection pooling, exponential backoff with jitter, and idempotency-safe retry logic.
- **grpcserver**: gRPC server with unary interceptor chain (recovery, logging, metrics, tracing, auth) and example `ProfileService`.
- **proto**: Protocol buffer definitions and generated Go code for `ProfileService`.
- **example**: Complete runnable example wiring HTTP and gRPC servers with all features.
- **CI**: GitHub Actions pipeline with linting, testing (with race detector), and build verification.
- **docs**: README with quick start, architecture diagram, and package documentation.
