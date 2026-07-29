package httpclient

import (
	"context"
	"errors"
	"io"
	"math"
	"math/rand/v2"
	"net"
	"net/http"
	"strconv"
	"time"
)

// Retrier configures automatic retries with exponential backoff and jitter.
type Retrier struct {
	MaxRetries  int           // default: 3
	BaseDelay   time.Duration // default: 100ms
	MaxDelay    time.Duration // default: 5s
	Jitter      float64       // default: 0.2 (20%)
	RetryUnsafe bool          // default: false — if true, allows retrying non-idempotent methods when body is replayable
}

// DefaultRetrier returns a retrier with sensible validated defaults.
func DefaultRetrier() *Retrier {
	return &Retrier{
		MaxRetries:  3,
		BaseDelay:   100 * time.Millisecond,
		MaxDelay:    5 * time.Second,
		Jitter:      0.2,
		RetryUnsafe: false,
	}
}

// Validate checks that retrier parameters are within safe bounds.
func (r *Retrier) Validate() error {
	if r.MaxRetries < 0 || r.MaxRetries > 20 {
		return errors.New("retrier: MaxRetries must be between 0 and 20")
	}
	if r.BaseDelay <= 0 {
		return errors.New("retrier: BaseDelay must be positive")
	}
	if r.MaxDelay <= 0 || r.MaxDelay < r.BaseDelay {
		return errors.New("retrier: MaxDelay must be >= BaseDelay")
	}
	if r.Jitter < 0 || r.Jitter > 1.0 {
		return errors.New("retrier: Jitter must be between 0.0 and 1.0")
	}
	return nil
}

// Do executes fn with retries according to the Retrier configuration.
func (r *Retrier) Do(ctx context.Context, fn func() (*http.Response, error), method string) (*http.Response, error) {
	if err := r.Validate(); err != nil {
		return nil, err
	}

	var resp *http.Response
	var err error

	for attempt := 0; attempt <= r.MaxRetries; attempt++ {
		resp, err = fn()

		if !r.isRetryable(resp, err, method) {
			return resp, err
		}
		if attempt == r.MaxRetries {
			break
		}

		// Drain up to 4KB of failed response body before closing
		if resp != nil && resp.Body != nil {
			_, _ = io.CopyN(io.Discard, resp.Body, 4096)
			_ = resp.Body.Close()
		}

		delay := r.calculateDelay(attempt, resp, ctx)

		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-time.After(delay):
		}
	}

	return resp, err
}

func (r *Retrier) isIdempotent(method string) bool {
	switch method {
	case http.MethodGet, http.MethodHead, http.MethodOptions, http.MethodPut, http.MethodDelete:
		return true
	default:
		return r.RetryUnsafe
	}
}

func (r *Retrier) isRetryable(resp *http.Response, err error, method string) bool {
	if !r.isIdempotent(method) {
		return false
	}

	if err != nil {
		var netErr net.Error
		return errors.As(err, &netErr)
	}

	if resp != nil {
		switch resp.StatusCode {
		case http.StatusTooManyRequests, http.StatusBadGateway, http.StatusServiceUnavailable, http.StatusGatewayTimeout:
			return true
		default:
			return false
		}
	}

	return false
}

func (r *Retrier) calculateDelay(attempt int, resp *http.Response, ctx context.Context) time.Duration {
	var finalDelay time.Duration

	if resp != nil && resp.StatusCode == http.StatusTooManyRequests {
		retryAfterStr := resp.Header.Get("Retry-After")
		if retryAfterStr != "" {
			if sec, err := strconv.Atoi(retryAfterStr); err == nil && sec >= 0 {
				finalDelay = time.Duration(sec) * time.Second
			} else if t, err := http.ParseTime(retryAfterStr); err == nil {
				if d := time.Until(t); d > 0 {
					finalDelay = d
				}
			}
		}
	}

	if finalDelay == 0 {
		// Exponential backoff: BaseDelay * 2^attempt
		delay := float64(r.BaseDelay) * math.Pow(2, float64(attempt))
		if delay > float64(r.MaxDelay) {
			delay = float64(r.MaxDelay)
		}

		// Jitter: +/- jitter%
		jitterAmount := delay * r.Jitter
		jitter := (rand.Float64() * 2 * jitterAmount) - jitterAmount
		finalDelay = time.Duration(delay + jitter)
	}

	// Cap by MaxDelay
	if finalDelay > r.MaxDelay {
		finalDelay = r.MaxDelay
	}
	if finalDelay < 0 {
		finalDelay = 0
	}

	// Cap by context deadline if set
	if deadline, ok := ctx.Deadline(); ok {
		if remaining := time.Until(deadline); remaining > 0 && finalDelay > remaining {
			finalDelay = remaining
		}
	}

	return finalDelay
}
