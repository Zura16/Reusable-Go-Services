// Package config provides configuration management for the servicekit project.
// It loads settings from environment variables and provides sensible defaults
// and validation to ensure the application starts with a valid configuration.
package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// Config holds the application configuration.
type Config struct {
	// Port is the HTTP server port.
	Port int
	// ShutdownTimeout is the maximum duration to wait for graceful shutdown.
	ShutdownTimeout time.Duration
	// LogLevel is the minimum log level to output (debug, info, warn, error).
	LogLevel string
	// AuthToken is a secret token used for authentication.
	AuthToken string
	// AllowInsecure explicitly enables insecure development mode when AuthToken is empty.
	AllowInsecure bool
	// GRPCPort is the gRPC server port.
	GRPCPort int
	// MetricsPort is the port for Prometheus metrics.
	MetricsPort int
}

// String implements fmt.Stringer to provide a safe string representation
// of the configuration, ensuring sensitive fields like AuthToken are redacted.
func (c Config) String() string {
	return fmt.Sprintf("Config{Port:%d ShutdownTimeout:%s LogLevel:%s AuthToken:[REDACTED] AllowInsecure:%t GRPCPort:%d MetricsPort:%d}",
		c.Port, c.ShutdownTimeout, c.LogLevel, c.AllowInsecure, c.GRPCPort, c.MetricsPort)
}

// Load reads the configuration from environment variables, applies defaults,
// and validates the values. It returns an error if any validation fails.
func Load() (Config, error) {
	c := Config{
		Port:            8080,
		ShutdownTimeout: 15 * time.Second,
		LogLevel:        "info",
		GRPCPort:        9090,
		MetricsPort:     9091,
	}

	if p := os.Getenv("SERVICEKIT_PORT"); p != "" {
		val, err := strconv.Atoi(p)
		if err != nil {
			return c, fmt.Errorf("invalid port %q: must be an integer", p)
		}
		c.Port = val
	}

	if p := os.Getenv("SERVICEKIT_GRPC_PORT"); p != "" {
		val, err := strconv.Atoi(p)
		if err != nil {
			return c, fmt.Errorf("invalid grpc port %q: must be an integer", p)
		}
		c.GRPCPort = val
	}

	if p := os.Getenv("SERVICEKIT_METRICS_PORT"); p != "" {
		val, err := strconv.Atoi(p)
		if err != nil {
			return c, fmt.Errorf("invalid metrics port %q: must be an integer", p)
		}
		c.MetricsPort = val
	}

	if st := os.Getenv("SERVICEKIT_SHUTDOWN_TIMEOUT"); st != "" {
		val, err := time.ParseDuration(st)
		if err != nil {
			return c, fmt.Errorf("invalid shutdown timeout %q: %v", st, err)
		}
		c.ShutdownTimeout = val
	}

	if ll := os.Getenv("SERVICEKIT_LOG_LEVEL"); ll != "" {
		c.LogLevel = strings.ToLower(ll)
	}

	if at := os.Getenv("SERVICEKIT_AUTH_TOKEN"); at != "" {
		c.AuthToken = at
	}

	if ai := os.Getenv("SERVICEKIT_ALLOW_INSECURE"); ai != "" {
		val, err := strconv.ParseBool(ai)
		if err != nil {
			return c, fmt.Errorf("invalid allow_insecure %q: must be a boolean", ai)
		}
		c.AllowInsecure = val
	}

	// Validation
	if c.Port < 1 || c.Port > 65535 {
		return c, fmt.Errorf("invalid port %d: must be between 1 and 65535", c.Port)
	}
	if c.GRPCPort < 1 || c.GRPCPort > 65535 {
		return c, fmt.Errorf("invalid grpc port %d: must be between 1 and 65535", c.GRPCPort)
	}
	if c.MetricsPort < 1 || c.MetricsPort > 65535 {
		return c, fmt.Errorf("invalid metrics port %d: must be between 1 and 65535", c.MetricsPort)
	}

	if c.ShutdownTimeout <= 0 {
		return c, fmt.Errorf("invalid shutdown timeout %s: must be greater than 0", c.ShutdownTimeout)
	}

	if c.GRPCPort == c.Port {
		return c, fmt.Errorf("invalid grpc port %d: must differ from http port %d", c.GRPCPort, c.Port)
	}
	if c.MetricsPort > 0 && c.MetricsPort != c.Port && c.GRPCPort == c.MetricsPort {
		return c, fmt.Errorf("invalid grpc port %d: must differ from dedicated metrics port %d", c.GRPCPort, c.MetricsPort)
	}


	switch c.LogLevel {
	case "debug", "info", "warn", "error":
		// valid
	default:
		return c, fmt.Errorf("invalid log level %q: must be debug, info, warn, or error", c.LogLevel)
	}

	return c, nil
}
