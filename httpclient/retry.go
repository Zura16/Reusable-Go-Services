package httpclient

import (
	"context"
	"errors"
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
	RetryUnsafe bool          // default: false — if true, retries POST/PATCH too
}

// DefaultRetrier returns a retrier with defaults.
func DefaultRetrier() *Retrier {
	return &Retrier{
		MaxRetries:  3,
		BaseDelay:   100 * time.Millisecond,
		MaxDelay:    5 * time.Second,
		Jitter:      0.2,
		RetryUnsafe: false,
	}
}

// Do executes fn with retries according to the Retrier configuration.
func (r *Retrier) Do(ctx context.Context, fn func() (*http.Response, error), method string) (*http.Response, error) {
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

		// Close body if we're retrying and response is not nil
		if resp != nil && resp.Body != nil {
			resp.Body.Close()
		}

		delay := r.calculateDelay(attempt, resp)

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
		// Network errors (connection refused, DNS, timeout from net package)
		var netErr net.Error
		if errors.As(err, &netErr) {
			return true
		}
		return false
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

func (r *Retrier) calculateDelay(attempt int, resp *http.Response) time.Duration {
	if resp != nil && resp.StatusCode == http.StatusTooManyRequests {
		retryAfterStr := resp.Header.Get("Retry-After")
		if retryAfterStr != "" {
			if sec, err := strconv.Atoi(retryAfterStr); err == nil {
				return time.Duration(sec) * time.Second
			}
		}
	}

	// Exponential backoff: BaseDelay * 2^attempt
	delay := float64(r.BaseDelay) * math.Pow(2, float64(attempt))
	if delay > float64(r.MaxDelay) {
		delay = float64(r.MaxDelay)
	}

	// Jitter: +/- jitter%
	jitterAmount := delay * r.Jitter
	jitter := (rand.Float64() * 2 * jitterAmount) - jitterAmount
	finalDelay := time.Duration(delay + jitter)
	
	if finalDelay < 0 {
		return 0
	}
	return finalDelay
}
