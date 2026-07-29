// Package httpserver provides HTTP middleware functions for recovery, request IDs, logging, metrics, and body limits.
package httpserver

import (
	"bufio"
	"context"
	"errors"
	"net"
	"net/http"
	"runtime/debug"
	"strconv"
	"strings"
	"time"


	"github.com/Zura16/Reusable-Go-Services/observability"

	"github.com/google/uuid"
	"go.uber.org/zap"
)

type contextKey string

const requestIDKey = contextKey("requestID")

// RequestIDFromContext retrieves the request ID from the context.
func RequestIDFromContext(ctx context.Context) string {
	if id, ok := ctx.Value(requestIDKey).(string); ok {
		return id
	}
	return ""
}

// responseWriter is a robust wrapper around http.ResponseWriter that captures status and supports optional interfaces.
type responseWriter struct {
	http.ResponseWriter
	status      int
	wroteHeader bool
}

func (rw *responseWriter) WriteHeader(code int) {
	if rw.wroteHeader {
		return
	}
	rw.status = code
	rw.wroteHeader = true
	rw.ResponseWriter.WriteHeader(code)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	if !rw.wroteHeader {
		rw.WriteHeader(http.StatusOK)
	}
	return rw.ResponseWriter.Write(b)
}

func (rw *responseWriter) Flush() {
	if f, ok := rw.ResponseWriter.(http.Flusher); ok {
		f.Flush()
	}
}

func (rw *responseWriter) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	if h, ok := rw.ResponseWriter.(http.Hijacker); ok {
		return h.Hijack()
	}
	return nil, nil, errors.New("http.Hijacker interface not supported by underlying response writer")
}

// Recovery middleware catches panics, logs the stack trace with zap, and sets 500 status.
func Recovery(logger *zap.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if err := recover(); err != nil {
					logger.Error("panic recovered",
						zap.Any("error", err),
						zap.ByteString("stack", debug.Stack()),
					)
					http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
				}
			}()
			next.ServeHTTP(w, r)
		})
	}
}

// RequestID middleware validates or generates a X-Request-ID header.
func RequestID() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			id := sanitizeRequestID(r.Header.Get("X-Request-ID"))
			if id == "" {
				id = uuid.New().String()
			}
			ctx := context.WithValue(r.Context(), requestIDKey, id)
			w.Header().Set("X-Request-ID", id)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func sanitizeRequestID(id string) string {
	id = strings.TrimSpace(id)
	if id == "" || len(id) > 64 {
		return ""
	}
	for _, ch := range id {
		if ch < 32 || ch > 126 {
			return ""
		}
	}
	return id
}

// Logging middleware logs method, route, status, latency, and request_id.
// It calls observability.RedactHeaders without custom arguments to preserve Authorization, Cookie, and Set-Cookie redaction.
func Logging(logger *zap.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			rw := &responseWriter{ResponseWriter: w, status: http.StatusOK}

			defer func() {
				latency := time.Since(start)
				reqID := RequestIDFromContext(r.Context())
				redactedHeaders := observability.RedactHeaders(r.Header)

				route := r.Pattern
				if route == "" {
					route = "unknown"
				}

				logger.Info("http request",
					zap.String("method", r.Method),
					zap.String("route", route),
					zap.Int("status", rw.status),
					zap.String("status_class", observability.StatusClass(rw.status)),
					zap.Duration("latency", latency),
					zap.String("request_id", reqID),
					zap.Any("headers", redactedHeaders),
				)
			}()

			next.ServeHTTP(rw, r)
		})
	}
}

// Metrics middleware records Prometheus counters and histograms using Go 1.22 route patterns.
func Metrics(m *observability.Metrics) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			rw := &responseWriter{ResponseWriter: w, status: http.StatusOK}

			defer func() {
				if m != nil {
					route := r.Pattern
					if route == "" {
						route = "unknown"
					}
					statusStr := strconv.Itoa(rw.status)
					statusClass := observability.StatusClass(rw.status)

					if m.HTTPRequestsTotal != nil {
						m.HTTPRequestsTotal.WithLabelValues(r.Method, route, statusStr, statusClass).Inc()
					}
					if m.HTTPRequestDuration != nil {
						m.HTTPRequestDuration.WithLabelValues(r.Method, route).Observe(time.Since(start).Seconds())
					}
				}
			}()

			next.ServeHTTP(rw, r)
		})
	}
}

// MaxBodySize middleware limits request body sizes using http.MaxBytesReader.
func MaxBodySize(limit int64) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if limit > 0 && r.Body != nil {
				r.Body = http.MaxBytesReader(w, r.Body, limit)
			}
			next.ServeHTTP(w, r)
		})
	}
}
