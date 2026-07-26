// Package observability provides structured logging, Prometheus metrics, and OpenTelemetry tracing
// for servicekit applications.
package observability

import (
	"net/http"
	"strings"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// DefaultSensitiveHeaders are the headers that are redacted by default.
var DefaultSensitiveHeaders = []string{"Authorization", "Cookie", "Set-Cookie"}

// NewLogger creates a new structured JSON logger at the specified level using zap.NewProductionConfig.
// The level string should be one of "debug", "info", "warn", "error", "dpanic", "panic", or "fatal".
func NewLogger(level string) (*zap.Logger, error) {
	cfg := zap.NewProductionConfig()
	
	parsedLevel, err := zapcore.ParseLevel(level)
	if err != nil {
		return nil, err
	}
	
	cfg.Level = zap.NewAtomicLevelAt(parsedLevel)
	
	logger, err := cfg.Build()
	if err != nil {
		return nil, err
	}
	
	return logger, nil
}

// RedactHeaders returns a copy of headers with sensitive header values replaced with "[REDACTED]".
// If no sensitive headers are provided, it uses DefaultSensitiveHeaders ("Authorization", "Cookie", "Set-Cookie").
func RedactHeaders(headers http.Header, sensitive ...string) map[string]string {
	if len(sensitive) == 0 {
		sensitive = DefaultSensitiveHeaders
	}
	
	sensitiveMap := make(map[string]bool, len(sensitive))
	for _, h := range sensitive {
		sensitiveMap[strings.ToLower(h)] = true
	}
	
	redacted := make(map[string]string, len(headers))
	for k, v := range headers {
		if sensitiveMap[strings.ToLower(k)] {
			redacted[k] = "[REDACTED]"
		} else {
			redacted[k] = strings.Join(v, ", ")
		}
	}
	
	return redacted
}
