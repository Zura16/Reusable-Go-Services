package grpcserver

import (
	"context"
	"sync"

	profilev1 "github.com/aalindkale/servicekit/proto/profile/v1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// ProfileServer implements the ProfileServiceServer interface.
type ProfileServer struct {
	profilev1.UnimplementedProfileServiceServer
	profiles map[string]*profilev1.GetProfileResponse
	mu       sync.RWMutex
}

// NewProfileServer creates a new ProfileServer with some seed data.
func NewProfileServer() *ProfileServer {
	return &ProfileServer{
		profiles: map[string]*profilev1.GetProfileResponse{
			"user1": {
				UserId:      "user1",
				DisplayName: "Alice",
				Email:       "alice@example.com",
			},
			"user2": {
				UserId:      "user2",
				DisplayName: "Bob",
				Email:       "bob@example.com",
			},
		},
	}
}

// GetProfile retrieves a profile by user ID.
func (s *ProfileServer) GetProfile(ctx context.Context, req *profilev1.GetProfileRequest) (*profilev1.GetProfileResponse, error) {
	if err := ctx.Err(); err != nil {
		if err == context.Canceled {
			return nil, status.Error(codes.Canceled, "request canceled")
		}
		if err == context.DeadlineExceeded {
			return nil, status.Error(codes.DeadlineExceeded, "deadline exceeded")
		}
		return nil, status.Error(codes.Internal, "context error")
	}

	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id cannot be empty")
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	profile, ok := s.profiles[req.UserId]
	if !ok {
		return nil, status.Error(codes.NotFound, "profile not found")
	}

	return profile, nil
}
