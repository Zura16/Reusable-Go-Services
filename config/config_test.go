package config_test

import (
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/Zura16/Reusable-Go-Services/config"

)

func TestLoad_Defaults(t *testing.T) {
	// t.Setenv is used by default tests if environment is dirty,
	// so it's safer not to use t.Parallel() for tests relying on environment variables.
	
	// Unset variables to test defaults cleanly
	t.Setenv("SERVICEKIT_PORT", "")
	t.Setenv("SERVICEKIT_GRPC_PORT", "")
	t.Setenv("SERVICEKIT_METRICS_PORT", "")
	t.Setenv("SERVICEKIT_LOG_LEVEL", "")
	t.Setenv("SERVICEKIT_SHUTDOWN_TIMEOUT", "")
	t.Setenv("SERVICEKIT_AUTH_TOKEN", "")

	c, err := config.Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if c.Port != 8080 {
		t.Errorf("expected default Port 8080, got %d", c.Port)
	}
	if c.ShutdownTimeout != 15*time.Second {
		t.Errorf("expected default ShutdownTimeout 15s, got %s", c.ShutdownTimeout)
	}
	if c.LogLevel != "info" {
		t.Errorf("expected default LogLevel 'info', got %q", c.LogLevel)
	}
	if c.GRPCPort != 9090 {
		t.Errorf("expected default GRPCPort 9090, got %d", c.GRPCPort)
	}
	if c.MetricsPort != 9091 {
		t.Errorf("expected default MetricsPort 9091, got %d", c.MetricsPort)
	}
}

func TestLoad_Overrides(t *testing.T) {
	t.Setenv("SERVICEKIT_PORT", "8081")
	t.Setenv("SERVICEKIT_SHUTDOWN_TIMEOUT", "30s")
	t.Setenv("SERVICEKIT_LOG_LEVEL", "debug")
	t.Setenv("SERVICEKIT_AUTH_TOKEN", "secret123")
	t.Setenv("SERVICEKIT_GRPC_PORT", "9092")
	t.Setenv("SERVICEKIT_METRICS_PORT", "9093")

	c, err := config.Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if c.Port != 8081 {
		t.Errorf("expected Port 8081, got %d", c.Port)
	}
	if c.ShutdownTimeout != 30*time.Second {
		t.Errorf("expected ShutdownTimeout 30s, got %s", c.ShutdownTimeout)
	}
	if c.LogLevel != "debug" {
		t.Errorf("expected LogLevel 'debug', got %q", c.LogLevel)
	}
	if c.AuthToken != "secret123" {
		t.Errorf("expected AuthToken 'secret123', got %q", c.AuthToken)
	}
	if c.GRPCPort != 9092 {
		t.Errorf("expected GRPCPort 9092, got %d", c.GRPCPort)
	}
	if c.MetricsPort != 9093 {
		t.Errorf("expected MetricsPort 9093, got %d", c.MetricsPort)
	}
}

func TestLoad_ValidationErrors(t *testing.T) {
	tests := []struct {
		name    string
		env     map[string]string
		wantErr string
	}{
		{
			name:    "bad port format",
			env:     map[string]string{"SERVICEKIT_PORT": "abc"},
			wantErr: "invalid port \"abc\": must be an integer",
		},
		{
			name:    "port out of range high",
			env:     map[string]string{"SERVICEKIT_PORT": "99999"},
			wantErr: "invalid port 99999: must be between 1 and 65535",
		},
		{
			name:    "port out of range low",
			env:     map[string]string{"SERVICEKIT_PORT": "0"},
			wantErr: "invalid port 0: must be between 1 and 65535",
		},
		{
			name:    "bad grpc port",
			env:     map[string]string{"SERVICEKIT_GRPC_PORT": "0"},
			wantErr: "invalid grpc port 0: must be between 1 and 65535",
		},
		{
			name:    "bad metrics port",
			env:     map[string]string{"SERVICEKIT_METRICS_PORT": "99999"},
			wantErr: "invalid metrics port 99999: must be between 1 and 65535",
		},
		{
			name:    "bad log level",
			env:     map[string]string{"SERVICEKIT_LOG_LEVEL": "trace"},
			wantErr: "invalid log level \"trace\": must be debug, info, warn, or error",
		},
		{
			name:    "bad timeout format",
			env:     map[string]string{"SERVICEKIT_SHUTDOWN_TIMEOUT": "invalid"},
			wantErr: "invalid shutdown timeout \"invalid\":",
		},
		{
			name:    "negative timeout",
			env:     map[string]string{"SERVICEKIT_SHUTDOWN_TIMEOUT": "-5s"},
			wantErr: "invalid shutdown timeout -5s: must be greater than 0",
		},
		{
			name:    "conflicting grpc and http port",
			env:     map[string]string{"SERVICEKIT_PORT": "9090", "SERVICEKIT_GRPC_PORT": "9090"},
			wantErr: "must differ from http port 9090",
		},
		{
			name:    "conflicting grpc and metrics port",
			env:     map[string]string{"SERVICEKIT_GRPC_PORT": "9091", "SERVICEKIT_METRICS_PORT": "9091"},
			wantErr: "must differ from dedicated metrics port 9091",
		},

	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Setenv("SERVICEKIT_PORT", "")
			t.Setenv("SERVICEKIT_GRPC_PORT", "")
			t.Setenv("SERVICEKIT_METRICS_PORT", "")
			t.Setenv("SERVICEKIT_LOG_LEVEL", "")
			t.Setenv("SERVICEKIT_SHUTDOWN_TIMEOUT", "")
			t.Setenv("SERVICEKIT_AUTH_TOKEN", "")

			for k, v := range tt.env {
				t.Setenv(k, v)
			}
			_, err := config.Load()
			if err == nil {
				t.Fatalf("expected error containing %q, got nil", tt.wantErr)
			}
			if !strings.Contains(err.Error(), tt.wantErr) {
				t.Errorf("expected error to contain %q, got %q", tt.wantErr, err.Error())
			}
		})
	}
}

func TestConfig_String(t *testing.T) {
	t.Parallel() // Safe to use t.Parallel() here as it doesn't use t.Setenv

	c := config.Config{
		Port:            8080,
		ShutdownTimeout: 15 * time.Second,
		LogLevel:        "info",
		AuthToken:       "super_secret_token_123",
		GRPCPort:        9090,
		MetricsPort:     9091,
	}

	str := c.String()
	if strings.Contains(str, "super_secret_token_123") {
		t.Error("String() leaked AuthToken!")
	}
	if !strings.Contains(str, "[REDACTED]") {
		t.Error("String() should contain [REDACTED]")
	}
}

func ExampleLoad() {
	// Example environment variables:
	// os.Setenv("SERVICEKIT_PORT", "8080")
	// os.Setenv("SERVICEKIT_LOG_LEVEL", "info")
	
	c, err := config.Load()
	if err != nil {
		fmt.Printf("failed to load config: %v\n", err)
		return
	}
	
	fmt.Println(c.Port)
	// Output: 8080
}
