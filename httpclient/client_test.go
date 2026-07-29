package httpclient

import (
	"bytes"
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
	"time"
)


func TestDefaultClient(t *testing.T) {
	t.Parallel()
	client := New()
	if client.httpClient.Timeout != 30*time.Second {
		t.Errorf("expected 30s timeout, got %v", client.httpClient.Timeout)
	}
	transport, ok := client.httpClient.Transport.(*http.Transport)
	if !ok {
		t.Fatalf("expected transport to be *http.Transport")
	}
	if transport.MaxIdleConns != 100 {
		t.Errorf("expected MaxIdleConns 100, got %d", transport.MaxIdleConns)
	}
	if transport.MaxIdleConnsPerHost != 10 {
		t.Errorf("expected MaxIdleConnsPerHost 10, got %d", transport.MaxIdleConnsPerHost)
	}
}

func TestGet(t *testing.T) {
	t.Parallel()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("OK"))
	}))
	defer server.Close()

	client := New()
	resp, err := client.Get(context.Background(), server.URL)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}
}

func TestReplayableBodyRetries(t *testing.T) {
	t.Parallel()
	var attempts int32

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		count := atomic.AddInt32(&attempts, 1)
		body, _ := io.ReadAll(r.Body)
		if string(body) != "payload-data" {
			t.Errorf("attempt %d received corrupted body: %s", count, string(body))
		}

		if count == 1 {
			w.WriteHeader(http.StatusServiceUnavailable)
			return
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	retrier := &Retrier{
		MaxRetries:  2,
		BaseDelay:   1 * time.Millisecond,
		MaxDelay:    10 * time.Millisecond,
		Jitter:      0.1,
		RetryUnsafe: true,
	}
	client := New(WithRetrier(retrier))

	// bytes.NewReader populates req.GetBody for replayability
	req, err := http.NewRequestWithContext(context.Background(), http.MethodPut, server.URL, bytes.NewReader([]byte("payload-data")))
	if err != nil {
		t.Fatalf("failed to create request: %v", err)
	}

	resp, err := client.Do(context.Background(), req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 OK after retry, got %d", resp.StatusCode)
	}
	if atomic.LoadInt32(&attempts) != 2 {
		t.Fatalf("expected 2 attempts, got %d", atomic.LoadInt32(&attempts))
	}
}

type nonReplayableBody struct {
	io.Reader
}

func (b nonReplayableBody) Close() error { return nil }

func TestNonReplayableBodyFailsCleanly(t *testing.T) {
	t.Parallel()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusServiceUnavailable)
	}))
	defer server.Close()

	retrier := &Retrier{
		MaxRetries:  2,
		BaseDelay:   1 * time.Millisecond,
		MaxDelay:    10 * time.Millisecond,
		Jitter:      0.1,
		RetryUnsafe: true,
	}
	client := New(WithRetrier(retrier))

	// Custom body without GetBody function
	req, _ := http.NewRequestWithContext(context.Background(), http.MethodPut, server.URL, nonReplayableBody{Reader: strings.NewReader("payload")})
	req.GetBody = nil

	_, err := client.Do(context.Background(), req)
	if err == nil {
		t.Fatal("expected error when trying to retry non-replayable body")
	}
}

func TestRetryAfterParsing(t *testing.T) {
	t.Parallel()

	retrier := DefaultRetrier()

	// Test 1: Numeric seconds
	respNum := &http.Response{
		StatusCode: http.StatusTooManyRequests,
		Header:     http.Header{"Retry-After": []string{"2"}},
	}
	delayNum := retrier.calculateDelay(0, respNum, context.Background())
	if delayNum < 1*time.Second || delayNum > 5*time.Second {
		t.Errorf("expected numeric delay ~2s, got %v", delayNum)
	}

	// Test 2: HTTP-date RFC1123 format
	futureDate := time.Now().Add(3 * time.Second).UTC().Format(http.TimeFormat)
	respDate := &http.Response{
		StatusCode: http.StatusTooManyRequests,
		Header:     http.Header{"Retry-After": []string{futureDate}},
	}
	delayDate := retrier.calculateDelay(0, respDate, context.Background())
	if delayDate <= 0 || delayDate > 5*time.Second {
		t.Errorf("expected HTTP-date delay <=5s, got %v", delayDate)
	}
}

func TestRetrierValidation(t *testing.T) {
	t.Parallel()
	invalidRetrier := &Retrier{
		MaxRetries: -1,
		BaseDelay:  0,
		MaxDelay:   0,
	}
	client := New(WithRetrier(invalidRetrier))

	req, _ := http.NewRequestWithContext(context.Background(), http.MethodGet, "http://localhost:8080", nil)
	_, err := client.Do(context.Background(), req)
	if err == nil {
		t.Fatal("expected error when using invalid Retrier configuration")
	}
}
