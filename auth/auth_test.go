package auth_test

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/aalindkale/servicekit/auth"
)

func TestStaticValidator(t *testing.T) {
	t.Parallel()

	expectedIdentity := auth.Identity{Subject: "user123", Roles: []string{"admin"}}
	validator := auth.NewStaticValidator("secret-token", expectedIdentity)

	tests := []struct {
		name    string
		token   string
		wantErr error
	}{
		{"ValidToken", "secret-token", nil},
		{"InvalidToken", "wrong-token", auth.ErrUnauthenticated},
		{"EmptyToken", "", auth.ErrUnauthenticated},
		{"PartialMatch", "secret", auth.ErrUnauthenticated},
		{"LongerMatch", "secret-token-extra", auth.ErrUnauthenticated},
	}

	for _, tc := range tests {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			id, err := validator.Validate(context.Background(), tc.token)
			if err != tc.wantErr {
				t.Errorf("expected error %v, got %v", tc.wantErr, err)
			}
			if err == nil && id.Subject != expectedIdentity.Subject {
				t.Errorf("expected identity %v, got %v", expectedIdentity, id)
			}
			// Test that error messages never contain the token string
			if err != nil && tc.token != "" && strings.Contains(err.Error(), tc.token) {
				t.Errorf("error message leaked token: %v", err)
			}
		})
	}
}

func TestMockValidator(t *testing.T) {
	t.Parallel()

	expectedIdentity := auth.Identity{Subject: "test-user"}
	validator := &auth.MockValidator{
		Identity: expectedIdentity,
		Err:      nil,
	}

	id, err := validator.Validate(context.Background(), "any-token")
	if err != nil {
		t.Errorf("expected no error, got %v", err)
	}
	if id.Subject != expectedIdentity.Subject {
		t.Errorf("expected %s, got %s", expectedIdentity.Subject, id.Subject)
	}

	validator.Err = auth.ErrForbidden
	_, err = validator.Validate(context.Background(), "any-token")
	if err != auth.ErrForbidden {
		t.Errorf("expected %v, got %v", auth.ErrForbidden, err)
	}
}

func TestHTTPMiddleware(t *testing.T) {
	t.Parallel()

	validator := auth.NewStaticValidator("valid-token", auth.Identity{Subject: "user1"})
	middleware := auth.HTTPMiddleware(validator)

	handler := middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id, ok := auth.IdentityFromContext(r.Context())
		if !ok {
			t.Errorf("expected identity in context")
		}
		if id.Subject != "user1" {
			t.Errorf("expected user1, got %s", id.Subject)
		}
		w.WriteHeader(http.StatusOK)
	}))

	tests := []struct {
		name           string
		authHeader     string
		expectedStatus int
	}{
		{"ValidBearer", "Bearer valid-token", http.StatusOK},
		{"InvalidBearer", "Bearer wrong-token", http.StatusUnauthorized},
		{"MissingHeader", "", http.StatusUnauthorized},
		{"MalformedHeaderNoBearer", "valid-token", http.StatusUnauthorized},
		{"MalformedHeaderEmptyToken", "Bearer ", http.StatusUnauthorized},
		{"MalformedHeaderExtraSpaces", "Bearer   ", http.StatusUnauthorized},
	}

	for _, tc := range tests {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			req := httptest.NewRequest(http.MethodGet, "/", nil)
			if tc.authHeader != "" {
				req.Header.Set("Authorization", tc.authHeader)
			}
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)

			if rec.Code != tc.expectedStatus {
				t.Errorf("expected status %d, got %d", tc.expectedStatus, rec.Code)
			}
			if rec.Code == http.StatusUnauthorized && strings.Contains(rec.Body.String(), "valid-token") {
				t.Errorf("response body leaked token")
			}
		})
	}
}

func TestRequireRole(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name           string
		identity       *auth.Identity
		role           string
		expectedStatus int
	}{
		{
			name:           "HasRole",
			identity:       &auth.Identity{Subject: "user1", Roles: []string{"admin", "user"}},
			role:           "admin",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "MissingRole",
			identity:       &auth.Identity{Subject: "user1", Roles: []string{"user"}},
			role:           "admin",
			expectedStatus: http.StatusForbidden,
		},
		{
			name:           "NoIdentity",
			identity:       nil,
			role:           "admin",
			expectedStatus: http.StatusUnauthorized,
		},
	}

	for _, tc := range tests {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			middleware := auth.RequireRole(tc.role)
			handler := middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusOK)
			}))

			req := httptest.NewRequest(http.MethodGet, "/", nil)
			if tc.identity != nil {
				ctx := auth.ContextWithIdentity(req.Context(), *tc.identity)
				req = req.WithContext(ctx)
			}

			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)

			if rec.Code != tc.expectedStatus {
				t.Errorf("expected status %d, got %d", tc.expectedStatus, rec.Code)
			}
		})
	}
}

func ExampleStaticValidator() {
	validator := auth.NewStaticValidator("secret", auth.Identity{
		Subject: "admin-user",
		Roles:   []string{"admin"},
	})

	id, err := validator.Validate(context.Background(), "secret")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	fmt.Println("Authenticated:", id.Subject)
	// Output: Authenticated: admin-user
}

func ExampleHTTPMiddleware() {
	validator := auth.NewStaticValidator("secret", auth.Identity{Subject: "user"})

	// Create middleware
	authMiddleware := auth.HTTPMiddleware(validator)
	roleMiddleware := auth.RequireRole("admin")

	// Protected handler
	protected := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id, _ := auth.IdentityFromContext(r.Context())
		_, _ = fmt.Fprintf(w, "Hello, %s", id.Subject)
	})

	// Wrap handler
	handler := authMiddleware(roleMiddleware(protected))
	_ = handler
}
