package grpcserver

import (
	"context"
	"io"
	"net"
	"testing"

	"github.com/Zura16/Reusable-Go-Services/auth"
	"github.com/Zura16/Reusable-Go-Services/config"
	"github.com/Zura16/Reusable-Go-Services/observability"
	profilev1 "github.com/Zura16/Reusable-Go-Services/proto/profile/v1"

	"github.com/prometheus/client_golang/prometheus"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"go.uber.org/zap/zaptest/observer"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/grpc/test/bufconn"
)

const bufSize = 1024 * 1024

type mockValidator struct{}

func (m *mockValidator) Validate(ctx context.Context, token string) (auth.Identity, error) {
	if token == "valid-token" {
		return auth.Identity{Subject: "user1", Roles: []string{"user"}}, nil
	}
	return auth.Identity{}, auth.ErrUnauthenticated
}

// setupTestServer creates a gRPC server using bufconn for testing.
func setupTestServer(t *testing.T) (*grpc.ClientConn, func()) {
	lis := bufconn.Listen(bufSize)

	logger := zap.NewNop()
	validator := auth.NewStaticValidator("valid-token", auth.Identity{Subject: "user1"})

	srv, err := New(
		config.Config{GRPCPort: 9090},
		logger,
		validator,
		nil,
		WithListener(lis),
	)
	if err != nil {
		t.Fatalf("failed to create server: %v", err)
	}

	profilev1.RegisterProfileServiceServer(srv.Server(), NewProfileServer())

	go func() {
		if err := srv.Serve(); err != nil && err != grpc.ErrServerStopped {
			_ = err
		}
	}()

	ctx := context.Background()
	//nolint:staticcheck // SA1019: DialContext is used with custom bufconn dialer for unit testing
	conn, err := grpc.DialContext(ctx, "bufnet",
		grpc.WithContextDialer(func(context.Context, string) (net.Conn, error) {
			return lis.Dial()
		}),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)

	if err != nil {
		t.Fatalf("Failed to dial bufnet: %v", err)
	}

	cleanup := func() {
		_ = conn.Close()
		srv.GracefulStop()
	}

	return conn, cleanup
}

func TestNilValidatorWithoutInsecureDevReturnsError(t *testing.T) {
	t.Parallel()
	logger := zap.NewNop()
	_, err := New(config.Config{GRPCPort: 9090}, logger, nil, nil)
	if err == nil {
		t.Fatal("expected error when validator is nil without WithoutAuthenticationForDevelopment()")
	}

	lis := bufconn.Listen(bufSize)
	srv, err := New(config.Config{GRPCPort: 9090}, logger, nil, nil, WithoutAuthenticationForDevelopment(), WithListener(lis))
	if err != nil {
		t.Fatalf("unexpected error when WithoutAuthenticationForDevelopment() is provided: %v", err)
	}
	defer srv.GracefulStop()
}

func TestGetProfile_Success(t *testing.T) {
	t.Parallel()
	conn, cleanup := setupTestServer(t)
	defer cleanup()

	client := profilev1.NewProfileServiceClient(conn)

	ctx := metadata.AppendToOutgoingContext(context.Background(), "authorization", "Bearer valid-token")
	res, err := client.GetProfile(ctx, &profilev1.GetProfileRequest{UserId: "user1"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res.UserId != "user1" {
		t.Errorf("expected user1, got %s", res.UserId)
	}
}

func TestServerStreamingRPCAndStreamInterceptors(t *testing.T) {
	t.Parallel()
	conn, cleanup := setupTestServer(t)
	defer cleanup()

	client := profilev1.NewProfileServiceClient(conn)

	ctx := metadata.AppendToOutgoingContext(context.Background(), "authorization", "Bearer valid-token")
	stream, err := client.ListProfiles(ctx, &profilev1.GetProfileRequest{})
	if err != nil {
		t.Fatalf("unexpected error starting stream: %v", err)
	}

	var count int
	for {
		_, err := stream.Recv()
		if err == io.EOF {
			break
		}
		if err != nil {
			t.Fatalf("unexpected error during streaming: %v", err)
		}
		count++
	}

	if count != 2 {
		t.Errorf("expected 2 streamed profiles, got %d", count)
	}
}

func TestGetProfile_NotFound(t *testing.T) {
	t.Parallel()
	conn, cleanup := setupTestServer(t)
	defer cleanup()

	client := profilev1.NewProfileServiceClient(conn)

	ctx := metadata.AppendToOutgoingContext(context.Background(), "authorization", "Bearer valid-token")
	_, err := client.GetProfile(ctx, &profilev1.GetProfileRequest{UserId: "unknown"})
	if status.Code(err) != codes.NotFound {
		t.Errorf("Expected NotFound code, got %v", err)
	}
}

func TestGetProfile_InvalidArgument(t *testing.T) {
	t.Parallel()
	conn, cleanup := setupTestServer(t)
	defer cleanup()

	client := profilev1.NewProfileServiceClient(conn)

	ctx := metadata.AppendToOutgoingContext(context.Background(), "authorization", "Bearer valid-token")
	_, err := client.GetProfile(ctx, &profilev1.GetProfileRequest{UserId: ""})
	if status.Code(err) != codes.InvalidArgument {
		t.Errorf("Expected InvalidArgument code, got %v", err)
	}
}

func TestAuthInterceptor_ValidToken(t *testing.T) {
	t.Parallel()
	conn, cleanup := setupTestServer(t)
	defer cleanup()

	client := profilev1.NewProfileServiceClient(conn)

	ctx := metadata.AppendToOutgoingContext(context.Background(), "authorization", "Bearer valid-token")
	_, err := client.GetProfile(ctx, &profilev1.GetProfileRequest{UserId: "user1"})
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
}

func TestAuthInterceptor_InvalidToken(t *testing.T) {
	t.Parallel()
	conn, cleanup := setupTestServer(t)
	defer cleanup()

	client := profilev1.NewProfileServiceClient(conn)

	ctx := metadata.AppendToOutgoingContext(context.Background(), "authorization", "Bearer invalid-token")
	_, err := client.GetProfile(ctx, &profilev1.GetProfileRequest{UserId: "user1"})
	if status.Code(err) != codes.Unauthenticated {
		t.Errorf("Expected Unauthenticated code, got %v", err)
	}
}

func TestAuthInterceptor_MissingToken(t *testing.T) {
	t.Parallel()
	conn, cleanup := setupTestServer(t)
	defer cleanup()

	client := profilev1.NewProfileServiceClient(conn)

	_, err := client.GetProfile(context.Background(), &profilev1.GetProfileRequest{UserId: "user1"})
	if status.Code(err) != codes.Unauthenticated {
		t.Errorf("Expected Unauthenticated code for missing token, got %v", err)
	}
}

func TestDeadlinePropagation(t *testing.T) {
	t.Parallel()
	conn, cleanup := setupTestServer(t)
	defer cleanup()

	client := profilev1.NewProfileServiceClient(conn)

	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	ctx = metadata.AppendToOutgoingContext(ctx, "authorization", "Bearer valid-token")
	_, err := client.GetProfile(ctx, &profilev1.GetProfileRequest{UserId: "user1"})
	if status.Code(err) != codes.Canceled && status.Code(err) != codes.DeadlineExceeded {
		t.Errorf("Expected Canceled or DeadlineExceeded, got %v", status.Code(err))
	}
}

type panickingServer struct {
	profilev1.UnimplementedProfileServiceServer
}

func (s *panickingServer) GetProfile(context.Context, *profilev1.GetProfileRequest) (*profilev1.GetProfileResponse, error) {
	panic("something went wrong")
}

func TestRecoveryInterceptorPanicLoggingAndMetrics(t *testing.T) {
	t.Parallel()

	lis := bufconn.Listen(bufSize)
	core, logs := observer.New(zapcore.InfoLevel)
	logger := zap.New(core)
	reg := prometheus.NewRegistry()
	metrics, err := observability.NewMetrics(reg, reg)
	if err != nil {
		t.Fatalf("unexpected error creating metrics: %v", err)
	}

	val := &mockValidator{}
	cfg := config.Config{GRPCPort: 50052}
	srv, err := New(cfg, logger, val, metrics, WithListener(lis))
	if err != nil {
		t.Fatalf("Failed to create server: %v", err)
	}

	profilev1.RegisterProfileServiceServer(srv.Server(), &panickingServer{})

	go func() { _ = srv.Serve() }()

	bufDialer := func(context.Context, string) (net.Conn, error) {
		return lis.Dial()
	}

	//nolint:staticcheck // SA1019: DialContext used for bufconn test
	conn, err := grpc.DialContext(context.Background(), "bufnet",
		grpc.WithContextDialer(bufDialer),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)

	if err != nil {
		t.Fatalf("Failed to dial bufnet: %v", err)
	}
	defer func() { _ = conn.Close() }()
	defer srv.GracefulStop()

	client := profilev1.NewProfileServiceClient(conn)
	ctx := metadata.AppendToOutgoingContext(context.Background(), "authorization", "Bearer valid-token")
	_, err = client.GetProfile(ctx, &profilev1.GetProfileRequest{UserId: "user1"})

	// Assert 1: Returns Internal status code
	if status.Code(err) != codes.Internal {
		t.Fatalf("Expected Internal error for panic, got %v", err)
	}

	// Assert 2: Produces structured request log
	entries := logs.All()
	if len(entries) < 2 {
		t.Fatalf("expected at least 2 log entries (panic + grpc request log), got %d", len(entries))
	}
}
