package grpcserver

import (
	"context"
	"net"
	"testing"


	"github.com/Zura16/Reusable-Go-Services/auth"
	"github.com/Zura16/Reusable-Go-Services/config"
	profilev1 "github.com/Zura16/Reusable-Go-Services/proto/profile/v1"

	"go.uber.org/zap"
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


func TestGetProfile_Success(t *testing.T) {
	t.Parallel()
	conn, _ := setupTestServer(t)
	client := profilev1.NewProfileServiceClient(conn)

	ctx := metadata.AppendToOutgoingContext(context.Background(), "authorization", "Bearer valid-token")
	resp, err := client.GetProfile(ctx, &profilev1.GetProfileRequest{UserId: "user1"})
	if err != nil {
		t.Fatalf("Expected success, got error: %v", err)
	}

	if resp.DisplayName != "Alice" {
		t.Errorf("Expected display name Alice, got %s", resp.DisplayName)
	}
}

func TestGetProfile_NotFound(t *testing.T) {
	t.Parallel()
	conn, _ := setupTestServer(t)
	client := profilev1.NewProfileServiceClient(conn)

	ctx := metadata.AppendToOutgoingContext(context.Background(), "authorization", "Bearer valid-token")
	_, err := client.GetProfile(ctx, &profilev1.GetProfileRequest{UserId: "unknown"})
	if status.Code(err) != codes.NotFound {
		t.Errorf("Expected NotFound code, got %v", err)
	}
}

func TestGetProfile_InvalidArgument(t *testing.T) {
	t.Parallel()
	conn, _ := setupTestServer(t)
	client := profilev1.NewProfileServiceClient(conn)

	ctx := metadata.AppendToOutgoingContext(context.Background(), "authorization", "Bearer valid-token")
	_, err := client.GetProfile(ctx, &profilev1.GetProfileRequest{UserId: ""})
	if status.Code(err) != codes.InvalidArgument {
		t.Errorf("Expected InvalidArgument code, got %v", err)
	}
}

func TestAuthInterceptor_ValidToken(t *testing.T) {
	t.Parallel()
	conn, _ := setupTestServer(t)
	client := profilev1.NewProfileServiceClient(conn)

	ctx := metadata.AppendToOutgoingContext(context.Background(), "authorization", "Bearer valid-token")
	_, err := client.GetProfile(ctx, &profilev1.GetProfileRequest{UserId: "user1"})
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
}

func TestAuthInterceptor_InvalidToken(t *testing.T) {
	t.Parallel()
	conn, _ := setupTestServer(t)
	client := profilev1.NewProfileServiceClient(conn)

	ctx := metadata.AppendToOutgoingContext(context.Background(), "authorization", "Bearer invalid-token")
	_, err := client.GetProfile(ctx, &profilev1.GetProfileRequest{UserId: "user1"})
	if status.Code(err) != codes.Unauthenticated {
		t.Errorf("Expected Unauthenticated code, got %v", err)
	}
}

func TestAuthInterceptor_MissingToken(t *testing.T) {
	t.Parallel()
	conn, _ := setupTestServer(t)
	client := profilev1.NewProfileServiceClient(conn)

	_, err := client.GetProfile(context.Background(), &profilev1.GetProfileRequest{UserId: "user1"})
	if status.Code(err) != codes.Unauthenticated {
		t.Errorf("Expected Unauthenticated code for missing token, got %v", err)
	}
}

func TestDeadlinePropagation(t *testing.T) {
	t.Parallel()
	conn, _ := setupTestServer(t)
	client := profilev1.NewProfileServiceClient(conn)

	// Use an already-cancelled context for deterministic failure without time.Sleep
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	ctx = metadata.AppendToOutgoingContext(ctx, "authorization", "Bearer valid-token")
	_, err := client.GetProfile(ctx, &profilev1.GetProfileRequest{UserId: "user1"})
	if status.Code(err) != codes.Canceled && status.Code(err) != codes.DeadlineExceeded {
		t.Errorf("Expected Canceled or DeadlineExceeded, got %v", status.Code(err))
	}
}


// panicing handler just for testing recovery
type panickingServer struct {
	profilev1.UnimplementedProfileServiceServer
}

func (s *panickingServer) GetProfile(context.Context, *profilev1.GetProfileRequest) (*profilev1.GetProfileResponse, error) {
	panic("something went wrong")
}

func TestRecoveryInterceptor(t *testing.T) {
	t.Parallel()
	
	lis := bufconn.Listen(bufSize)
	logger := zap.NewNop()
	val := &mockValidator{}
	
	cfg := config.Config{GRPCPort: 50052}
	srv, err := New(cfg, logger, val, nil, WithListener(lis))
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
	
	if status.Code(err) != codes.Internal {
		t.Errorf("Expected Internal error for panic, got %v", err)
	}
}
