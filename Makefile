.PHONY: all generate lint test bench coverage build clean tools

# Default target
all: generate lint test build

# Generate protobuf Go code
generate:
	protoc --go_out=. --go_opt=paths=source_relative \
	       --go-grpc_out=. --go-grpc_opt=paths=source_relative \
	       proto/profile/v1/profile.proto

# Run linter
lint:
	golangci-lint run --enable=govet,staticcheck,unused,ineffassign ./...

# Run tests with race detector
test:
	go test -race -count=1 -coverprofile=coverage.out ./auth ./config ./grpcserver ./httpclient ./httpserver ./observability

# Run performance benchmarks with memory allocation metrics
bench:
	go test -bench=. -benchmem ./...

# View test coverage report
coverage: test
	go tool cover -func=coverage.out

# Build all packages and example binary
build:
	go build ./...
	go build -o /dev/null ./example/main.go

# Clean build artifacts
clean:
	rm -f coverage.out

# Install development tools
tools:
	go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
	go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
