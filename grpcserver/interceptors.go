// Package grpcserver provides gRPC unary server interceptors for recovery, logging, metrics, and auth.
package grpcserver

import (
	"context"
	"runtime/debug"
	"strings"
	"time"

	"github.com/aalindkale/servicekit/auth"
	"github.com/aalindkale/servicekit/observability"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

// UnaryRecoveryInterceptor catches panics and returns an Internal error.
func UnaryRecoveryInterceptor(logger *zap.Logger) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (resp interface{}, err error) {
		defer func() {
			if r := recover(); r != nil {
				logger.Error("Panic in gRPC handler",
					zap.String("method", info.FullMethod),
					zap.Any("panic", r),
					zap.ByteString("stack", debug.Stack()),
				)
				err = status.Errorf(codes.Internal, "Internal server error")
			}
		}()
		return handler(ctx, req)
	}
}

// UnaryLoggingInterceptor logs the method, duration, and gRPC status code.
func UnaryLoggingInterceptor(logger *zap.Logger) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
		start := time.Now()
		
		// Logging interceptor executes next handler without mutating context metadata
		resp, err := handler(ctx, req)
		
		duration := time.Since(start)
		code := status.Code(err)
		
		logger.Info("gRPC request",
			zap.String("method", info.FullMethod),
			zap.Duration("duration", duration),
			zap.String("status_code", code.String()),
		)
		
		return resp, err
	}
}

// UnaryMetricsInterceptor increments metrics.
func UnaryMetricsInterceptor(m *observability.Metrics) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
		start := time.Now()
		
		resp, err := handler(ctx, req)
		
		code := status.Code(err).String()
		
		if m != nil {
			if m.GRPCRequestsTotal != nil {
				m.GRPCRequestsTotal.WithLabelValues(info.FullMethod, code).Inc()
			}
			if m.GRPCRequestDuration != nil {
				m.GRPCRequestDuration.WithLabelValues(info.FullMethod).Observe(time.Since(start).Seconds())
			}
		}
		
		return resp, err
	}
}

// UnaryAuthInterceptor validates the authorization token.
func UnaryAuthInterceptor(v auth.TokenValidator) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
		// Skip auth for reflection and health check methods
		if strings.HasPrefix(info.FullMethod, "/grpc.reflection.") || strings.HasPrefix(info.FullMethod, "/grpc.health.v1.Health/") {
			return handler(ctx, req)
		}
		
		if v == nil {
			return handler(ctx, req)
		}

		md, ok := metadata.FromIncomingContext(ctx)
		if !ok {
			return nil, status.Error(codes.Unauthenticated, "metadata is not provided")
		}

		values := md.Get("authorization")
		if len(values) == 0 {
			return nil, status.Error(codes.Unauthenticated, "authorization token is not provided")
		}

		authHeader := values[0]
		token := strings.TrimPrefix(authHeader, "Bearer ")
		
		identity, err := v.Validate(ctx, token)
		if err != nil {
			return nil, status.Error(codes.Unauthenticated, "invalid token")
		}

		ctx = auth.ContextWithIdentity(ctx, identity)
		return handler(ctx, req)
	}
}
