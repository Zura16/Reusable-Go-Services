// Package grpcserver provides a gRPC server setup with unary/stream interceptors, health service, and service registration.
package grpcserver

import (
	"crypto/tls"
	"errors"
	"fmt"
	"net"

	"github.com/Zura16/Reusable-Go-Services/auth"
	"github.com/Zura16/Reusable-Go-Services/config"
	"github.com/Zura16/Reusable-Go-Services/observability"

	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/health"
	"google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/reflection"
)

type serverConfig struct {
	validator         auth.TokenValidator
	reflectionEnabled bool
	allowInsecureDev  bool
	tlsConfig         *tls.Config
	listener          net.Listener
	maxRecvMsgSize    int
	maxSendMsgSize    int
}

// Option configures the gRPC server.
type Option func(*serverConfig)

// WithAuthentication configures the TokenValidator for gRPC authentication.
func WithAuthentication(v auth.TokenValidator) Option {
	return func(c *serverConfig) {
		c.validator = v
	}
}

// WithInsecureDevelopmentMode explicitly opts out of authentication requirements for local development.
func WithInsecureDevelopmentMode() Option {
	return func(c *serverConfig) {
		c.allowInsecureDev = true
	}
}

// WithoutAuthenticationForDevelopment explicitly opts out of authentication requirements for local development.
func WithoutAuthenticationForDevelopment() Option {
	return func(c *serverConfig) {
		c.allowInsecureDev = true
	}
}

// WithReflection enables gRPC reflection on the server.
func WithReflection() Option {
	return func(c *serverConfig) {
		c.reflectionEnabled = true
	}
}

// WithTLS configures TLS transport credentials for the gRPC server.
func WithTLS(tlsConfig *tls.Config) Option {
	return func(c *serverConfig) {
		c.tlsConfig = tlsConfig
	}
}

// WithListener sets a custom net.Listener for the gRPC server (useful for in-memory testing with bufconn).
func WithListener(l net.Listener) Option {
	return func(c *serverConfig) {
		c.listener = l
	}
}

// WithMaxMsgSize sets maximum receive and send message sizes.
func WithMaxMsgSize(recvBytes, sendBytes int) Option {
	return func(c *serverConfig) {
		c.maxRecvMsgSize = recvBytes
		c.maxSendMsgSize = sendBytes
	}
}

// Server wraps a gRPC server and its listener.
type Server struct {
	server       *grpc.Server
	listener     net.Listener
	logger       *zap.Logger
	healthServer *health.Server
}

// New creates a new gRPC server with interceptor chain and health service.
func New(cfg config.Config, logger *zap.Logger, validator auth.TokenValidator, metrics *observability.Metrics, opts ...Option) (*Server, error) {
	if logger == nil {
		logger = zap.NewNop()
	}

	sc := &serverConfig{
		validator:      validator,
		maxRecvMsgSize: 4 << 20, // 4MB default
		maxSendMsgSize: 4 << 20, // 4MB default
	}

	for _, opt := range opts {
		opt(sc)
	}

	if sc.validator == nil && !sc.allowInsecureDev {
		return nil, errors.New("grpcserver: authentication is required; pass a TokenValidator via WithAuthentication or explicitly call WithInsecureDevelopmentMode()")
	}

	// Interceptor chain order: Logging -> Metrics -> Tracing -> Recovery -> Auth -> Handler
	unaryInterceptors := []grpc.UnaryServerInterceptor{
		UnaryLoggingInterceptor(logger),
	}
	if metrics != nil {
		unaryInterceptors = append(unaryInterceptors, UnaryMetricsInterceptor(metrics))
	}
	unaryInterceptors = append(unaryInterceptors, otelgrpc.UnaryServerInterceptor()) //nolint:staticcheck
	unaryInterceptors = append(unaryInterceptors, UnaryRecoveryInterceptor(logger))
	if sc.validator != nil {
		unaryInterceptors = append(unaryInterceptors, UnaryAuthInterceptor(sc.validator))
	}

	streamInterceptors := []grpc.StreamServerInterceptor{
		StreamLoggingInterceptor(logger),
	}
	if metrics != nil {
		streamInterceptors = append(streamInterceptors, StreamMetricsInterceptor(metrics))
	}
	streamInterceptors = append(streamInterceptors, otelgrpc.StreamServerInterceptor()) //nolint:staticcheck
	streamInterceptors = append(streamInterceptors, StreamRecoveryInterceptor(logger))
	if sc.validator != nil {
		streamInterceptors = append(streamInterceptors, StreamAuthInterceptor(sc.validator))
	}

	serverOpts := []grpc.ServerOption{
		grpc.ChainUnaryInterceptor(unaryInterceptors...),
		grpc.ChainStreamInterceptor(streamInterceptors...),
		grpc.MaxRecvMsgSize(sc.maxRecvMsgSize),
		grpc.MaxSendMsgSize(sc.maxSendMsgSize),
	}

	if sc.tlsConfig != nil {
		serverOpts = append(serverOpts, grpc.Creds(credentials.NewTLS(sc.tlsConfig)))
	}

	grpcSrv := grpc.NewServer(serverOpts...)

	// Register gRPC Health Check service
	healthSrv := health.NewServer()
	grpc_health_v1.RegisterHealthServer(grpcSrv, healthSrv)
	healthSrv.SetServingStatus("", grpc_health_v1.HealthCheckResponse_SERVING)

	if sc.reflectionEnabled {
		reflection.Register(grpcSrv)
	}

	var lis net.Listener
	if sc.listener != nil {
		lis = sc.listener
	} else {
		var err error
		addr := fmt.Sprintf(":%d", cfg.GRPCPort)
		lis, err = net.Listen("tcp", addr)
		if err != nil {
			return nil, fmt.Errorf("failed to listen on %s: %w", addr, err)
		}
	}

	return &Server{
		server:       grpcSrv,
		listener:     lis,
		logger:       logger,
		healthServer: healthSrv,
	}, nil
}

// Server returns the underlying *grpc.Server instance.
func (s *Server) Server() *grpc.Server {
	return s.server
}

// Listener returns the net.Listener being used by the server.
func (s *Server) Listener() net.Listener {
	return s.listener
}

// Serve starts listening for incoming gRPC requests.
func (s *Server) Serve() error {
	s.logger.Info("starting grpc server", zap.String("addr", s.listener.Addr().String()))
	return s.server.Serve(s.listener)
}

// GracefulStop gracefully stops the gRPC server.
func (s *Server) GracefulStop() {
	s.logger.Info("shutting down grpc server gracefully")
	if s.healthServer != nil {
		s.healthServer.SetServingStatus("", grpc_health_v1.HealthCheckResponse_NOT_SERVING)
	}
	s.server.GracefulStop()
}

// Stop forcefully stops the gRPC server.
func (s *Server) Stop() {
	s.logger.Info("forcefully stopping grpc server")
	s.server.Stop()
}
