package auth

import (
	"context"
	"crypto/subtle"
	"errors"
	"strings"
)

// ErrUnauthenticated indicates that the request lacks valid authentication credentials.
var ErrUnauthenticated = errors.New("unauthenticated")

// ErrForbidden indicates that the authenticated caller does not have permission for the requested operation.
var ErrForbidden = errors.New("forbidden")

// Identity represents an authenticated caller.
type Identity struct {
	Subject string
	Roles   []string
}

// TokenValidator validates bearer tokens and returns the authenticated identity.
type TokenValidator interface {
	Validate(ctx context.Context, token string) (Identity, error)
}

// StaticValidator validates against a fixed token using constant-time comparison.
type StaticValidator struct {
	validToken string
	identity   Identity
}

// NewStaticValidator creates a new StaticValidator that expects the given token and returns the specified identity.
func NewStaticValidator(validToken string, identity Identity) *StaticValidator {
	rolesCopy := append([]string(nil), identity.Roles...)
	return &StaticValidator{
		validToken: validToken,
		identity: Identity{
			Subject: identity.Subject,
			Roles:   rolesCopy,
		},
	}
}

// Validate checks if the provided token matches the expected token using constant-time comparison.
// It returns a copy of the configured Identity if valid, or ErrUnauthenticated otherwise.
// The provided token is never logged or included in the error message.
func (v *StaticValidator) Validate(ctx context.Context, token string) (Identity, error) {
	validBytes := []byte(v.validToken)
	tokenBytes := []byte(token)

	if len(validBytes) == len(tokenBytes) && len(validBytes) > 0 {
		if subtle.ConstantTimeCompare(validBytes, tokenBytes) == 1 {
			rolesCopy := append([]string(nil), v.identity.Roles...)
			return Identity{
				Subject: v.identity.Subject,
				Roles:   rolesCopy,
			}, nil
		}
	}

	return Identity{}, ErrUnauthenticated
}

// MockValidator is a configurable validator for testing.
type MockValidator struct {
	Identity Identity
	Err      error
}

// Validate returns the pre-configured Identity and Err.
func (v *MockValidator) Validate(ctx context.Context, token string) (Identity, error) {
	if v.Err != nil {
		return Identity{}, v.Err
	}
	rolesCopy := append([]string(nil), v.Identity.Roles...)
	return Identity{
		Subject: v.Identity.Subject,
		Roles:   rolesCopy,
	}, nil
}

// ParseBearer parses an Authorization header string into a token.
// It enforces case-insensitive "Bearer <token>" format and rejects empty or multi-part values.
func ParseBearer(header string) (string, error) {
	header = strings.TrimSpace(header)
	if header == "" {
		return "", ErrUnauthenticated
	}

	parts := strings.Fields(header)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return "", ErrUnauthenticated
	}

	if parts[1] == "" {
		return "", ErrUnauthenticated
	}

	return parts[1], nil
}

// contextKey is a custom type for context keys to avoid collisions.
type contextKey string

const identityContextKey contextKey = "identity"

// ContextWithIdentity returns a new Context that carries the provided Identity.
func ContextWithIdentity(ctx context.Context, identity Identity) context.Context {
	return context.WithValue(ctx, identityContextKey, identity)
}

// IdentityFromContext extracts the Identity from the context, if present.
func IdentityFromContext(ctx context.Context) (Identity, bool) {
	identity, ok := ctx.Value(identityContextKey).(Identity)
	return identity, ok
}
