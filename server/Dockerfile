FROM golang:1.23-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

ENV GOPROXY=https://goproxy.cn,direct

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /server ./cmd/server

FROM scratch

COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /server /app/server

WORKDIR /app

EXPOSE 8080

CMD ["/app/server"]
