// Package httpclient provides a context-aware HTTP client with connection
// pooling, configurable timeouts, and automatic retries with exponential
// backoff and jitter.
package httpclient

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/http"
	"time"

	"go.uber.org/zap"
)

// Option configures the HTTP client.
type Option func(*Client)

// Client is a context-aware HTTP client.
type Client struct {
	httpClient *http.Client
	retrier    *Retrier
	logger     *zap.Logger
}

// New creates a new Client with sensible defaults.
func New(opts ...Option) *Client {
	transport := &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		DialContext: (&net.Dialer{
			Timeout:   30 * time.Second,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		ForceAttemptHTTP2:     true,
		MaxIdleConns:          100,
		MaxIdleConnsPerHost:   10,
		IdleConnTimeout:       90 * time.Second,
		TLSHandshakeTimeout:   10 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
	}

	c := &Client{
		httpClient: &http.Client{
			Timeout:   30 * time.Second,
			Transport: transport,
		},
		retrier: DefaultRetrier(),
		logger:  zap.NewNop(),
	}

	for _, opt := range opts {
		opt(c)
	}

	return c
}

// WithTimeout sets the timeout for the HTTP client.
func WithTimeout(d time.Duration) Option {
	return func(c *Client) {
		c.httpClient.Timeout = d
	}
}

// WithTransport sets the underlying HTTP RoundTripper transport.
func WithTransport(rt http.RoundTripper) Option {
	return func(c *Client) {
		c.httpClient.Transport = rt
	}
}

// WithLogger sets the logger for the HTTP client.
func WithLogger(l *zap.Logger) Option {
	return func(c *Client) {
		if l != nil {
			c.logger = l
		}
	}
}

// WithRetrier sets the retrier for the HTTP client.
func WithRetrier(r *Retrier) Option {
	return func(c *Client) {
		c.retrier = r
	}
}

// CloseIdleConnections closes any idle connections in the underlying transport.
func (c *Client) CloseIdleConnections() {
	if tr, ok := c.httpClient.Transport.(interface{ CloseIdleConnections() }); ok {
		tr.CloseIdleConnections()
	}
}

// Get executes a GET request using Do.
func (c *Client) Get(ctx context.Context, url string) (*http.Response, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	return c.Do(ctx, req)
}

// Do executes an HTTP request.
// If retries are configured and the body is non-replayable (GetBody == nil), the initial request is performed with the original body, but retries are disabled.
func (c *Client) Do(ctx context.Context, req *http.Request) (*http.Response, error) {
	if req == nil {
		return nil, errors.New("httpclient: request is nil")
	}

	req = req.WithContext(ctx)
	if c.retrier == nil {
		return c.httpClient.Do(req)
	}

	// Copy retrier config so we can disable retries for non-replayable bodies without mutating shared state
	retrierConfig := *c.retrier

	// Policy: If a body is provided but GetBody is nil, perform initial request with original body, but disable retries.
	if req.Body != nil && req.Body != http.NoBody && req.GetBody == nil {
		retrierConfig.MaxRetries = 0
	}

	var attemptCount int
	resp, err := retrierConfig.Do(ctx, func() (*http.Response, error) {
		attemptCount++
		currentReq, cloneErr := prepareRequestForAttempt(req, attemptCount)
		if cloneErr != nil {
			c.logger.Error("failed to prepare request for attempt",
				zap.Int("attempt", attemptCount),
				zap.Error(cloneErr),
			)
			return nil, cloneErr
		}

		res, httpErr := c.httpClient.Do(currentReq)
		if httpErr != nil {
			c.logger.Debug("HTTP request attempt failed with error",
				zap.Int("attempt", attemptCount),
				zap.String("method", req.Method),
				zap.String("host", req.URL.Host),
				zap.String("path", req.URL.EscapedPath()),
				zap.Error(httpErr),
			)
		} else if res != nil && res.StatusCode >= 400 {
			c.logger.Debug("HTTP request attempt returned error status",
				zap.Int("attempt", attemptCount),
				zap.String("method", req.Method),
				zap.String("host", req.URL.Host),
				zap.String("path", req.URL.EscapedPath()),
				zap.Int("status", res.StatusCode),
			)
		}
		return res, httpErr
	}, req.Method)

	return resp, err
}

func prepareRequestForAttempt(req *http.Request, attempt int) (*http.Request, error) {
	if req.Body == nil || req.Body == http.NoBody {
		return req.Clone(req.Context()), nil
	}

	// Attempt 1: use original body directly
	if attempt == 1 {
		return req, nil
	}

	// Attempt > 1: recreate body via GetBody
	if req.GetBody == nil {
		return nil, errors.New("request body is not replayable for retry attempt (GetBody is nil)")
	}

	cloned := req.Clone(req.Context())
	body, err := req.GetBody()
	if err != nil {
		return nil, fmt.Errorf("recreating request body for attempt %d: %w", attempt, err)
	}
	cloned.Body = body
	return cloned, nil
}
