// Package grpcserver provides a gRPC server setup with unary interceptors and service registration.
package grpcserver

import (
	"fmt"
	"net"

	"github.com/aalindkale/servicekit/auth"
	"github.com/aalindkale/servicekit/config"
	"github.com/aalindkale/servicekit/observability"
	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

type serverConfig struct {
	reflectionEnabled bool
	listener          net.Listener
}

// Option configures the serverConfig.
type Option func(*serverConfig)

// WithReflection enables gRPC reflection on the server.
func WithReflection() Option {
	return func(c *serverConfig) {
		c.reflectionEnabled = true
	}
}

// WithListener uses a custom listener for the server. Useful for testing (e.g., bufconn).
func WithListener(lis net.Listener) Option {
	return func(c *serverConfig) {
		c.listener = lis
	}
}

// Server wraps a grpc.Server.
type Server struct {
	grpcServer *grpc.Server
	listener   net.Listener
	logger     *zap.Logger
	port       int
}

// New creates a new gRPC server with the default interceptor chain.
// Default interceptor chain order: Recovery -> Logging -> Metrics -> Auth
func New(cfg config.Config, logger *zap.Logger, validator auth.TokenValidator, metrics *observability.Metrics, opts ...Option) (*Server, error) {
	c := &serverConfig{}
	for _, opt := range opts {
		opt(c)
	}

	chain := []grpc.UnaryServerInterceptor{
		UnaryRecoveryInterceptor(logger),
		UnaryLoggingInterceptor(logger),
		UnaryMetricsInterceptor(metrics),
		UnaryAuthInterceptor(validator),
	}

	grpcOpts := []grpc.ServerOption{
		grpc.StatsHandler(otelgrpc.NewServerHandler()),
		grpc.ChainUnaryInterceptor(chain...),
	}

	grpcServer := grpc.NewServer(grpcOpts...)

	if c.reflectionEnabled {
		reflection.Register(grpcServer)
	}

	var lis net.Listener
	if c.listener != nil {
		lis = c.listener
	}

	return &Server{
		grpcServer: grpcServer,
		listener:   lis,
		logger:     logger,
		port:       cfg.GRPCPort,
	}, nil
}

// Serve starts listening on the configured port.
func (s *Server) Serve() error {
	if s.listener == nil {
		lis, err := net.Listen("tcp", fmt.Sprintf(":%d", s.port))
		if err != nil {
			return err
		}
		s.listener = lis
	}
	s.logger.Info("Starting gRPC server", zap.Int("port", s.port))
	return s.grpcServer.Serve(s.listener)
}

// GracefulStop gracefully shuts down the gRPC server.
func (s *Server) GracefulStop() {
	s.logger.Info("Gracefully stopping gRPC server")
	s.grpcServer.GracefulStop()
}

// RegisterService registers a service and its implementation to the gRPC server.
func (s *Server) RegisterService(desc *grpc.ServiceDesc, impl interface{}) {
	s.grpcServer.RegisterService(desc, impl)
}

// Server returns the underlying grpc.Server.
func (s *Server) Server() *grpc.Server {
	return s.grpcServer
}
