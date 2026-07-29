// Package auth provides HTTP middleware for bearer token validation and role-based authorization.
package auth

import (
	"net/http"
)

// HTTPMiddleware creates middleware that authenticates requests using a bearer token.
// It extracts the token from the "Authorization" header using ParseBearer and uses the provided TokenValidator.
// On success, it injects the Identity into the request context.
// On failure (including nil validator or multiple Authorization headers), it returns 401 Unauthorized.
func HTTPMiddleware(validator TokenValidator) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if validator == nil {
				http.Error(w, "unauthenticated", http.StatusUnauthorized)
				return
			}

			authHeaders := r.Header["Authorization"]
			if len(authHeaders) != 1 {
				http.Error(w, "unauthenticated", http.StatusUnauthorized)
				return
			}

			token, err := ParseBearer(authHeaders[0])
			if err != nil {
				http.Error(w, "unauthenticated", http.StatusUnauthorized)
				return
			}

			identity, err := validator.Validate(r.Context(), token)
			if err != nil {
				// Avoid leaking details or token in response.
				http.Error(w, "unauthenticated", http.StatusUnauthorized)
				return
			}

			ctx := ContextWithIdentity(r.Context(), identity)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireRole creates middleware that ensures the authenticated user has the specified role.
// It expects the Identity to already be in the request context (e.g., via HTTPMiddleware).
// It returns a 401 if the Identity is missing, and a 403 if the user lacks the role.
func RequireRole(role string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			identity, ok := IdentityFromContext(r.Context())
			if !ok {
				http.Error(w, "unauthenticated", http.StatusUnauthorized)
				return
			}

			hasRole := false
			for _, r := range identity.Roles {
				if r == role {
					hasRole = true
					break
				}
			}

			if !hasRole {
				http.Error(w, "forbidden", http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
