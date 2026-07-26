// Package httpclient provides a context-aware HTTP client with connection
// pooling, configurable timeouts, and automatic retries with exponential
// backoff and jitter.
package httpclient

import (
	"context"
	"io"
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

// WithTransport sets the underlying HTTP transport.
func WithTransport(t *http.Transport) Option {
	return func(c *Client) {
		c.httpClient.Transport = t
	}
}

// WithLogger sets the logger for the HTTP client.
func WithLogger(l *zap.Logger) Option {
	return func(c *Client) {
		c.logger = l
	}
}

// WithRetrier sets the retrier for the HTTP client.
func WithRetrier(r *Retrier) Option {
	return func(c *Client) {
		c.retrier = r
	}
}

// Do executes an HTTP request with retries.
func (c *Client) Do(ctx context.Context, req *http.Request) (*http.Response, error) {
	req = req.WithContext(ctx)
	if c.retrier == nil {
		return c.httpClient.Do(req)
	}

	return c.retrier.Do(ctx, func() (*http.Response, error) {
		if req.GetBody != nil {
			rc, err := req.GetBody()
			if err == nil {
				req.Body = rc
			}
		}
		return c.httpClient.Do(req)
	}, req.Method)
}

// Get is a convenience method for a GET request.
func (c *Client) Get(ctx context.Context, url string) (*http.Response, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	return c.Do(ctx, req)
}

// Post is a convenience method for a POST request.
func (c *Client) Post(ctx context.Context, url, contentType string, body io.Reader) (*http.Response, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, body)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", contentType)
	return c.Do(ctx, req)
}
