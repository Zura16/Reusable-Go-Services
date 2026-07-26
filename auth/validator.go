package auth

import (
	"context"
	"crypto/subtle"
	"errors"
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
	return &StaticValidator{
		validToken: validToken,
		identity:   identity,
	}
}

// Validate checks if the provided token matches the expected token using constant-time comparison.
// It returns the configured Identity if valid, or ErrUnauthenticated otherwise.
// The provided token is never logged or included in the error message.
func (v *StaticValidator) Validate(ctx context.Context, token string) (Identity, error) {
	validBytes := []byte(v.validToken)
	tokenBytes := []byte(token)

	// We use a constant time compare only if the lengths match.
	// This leaks the length of the valid token, but prevents timing attacks on the token content itself.
	if len(validBytes) == len(tokenBytes) {
		if subtle.ConstantTimeCompare(validBytes, tokenBytes) == 1 {
			return v.identity, nil
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
	return v.Identity, v.Err
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
