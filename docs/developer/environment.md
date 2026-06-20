# Environment Variables

Complete reference for AIInsight environment variables.

## Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/aiinsight` |
| `JWT_SECRET` | Secret for signing JWT tokens (min 32 chars) | `<random-string>` |

## Authentication

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | **Yes** | — | HS256 secret for JWT tokens. App fails to start if missing. |
| `REFRESH_SECRET` | No | — | Not used. Refresh tokens use SHA-256 hashing. |

## Database

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string |
| `POSTGRES_PASSWORD` | No | `aiinsight_secret` | PostgreSQL password (Docker only) |

## Server

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` (ingestion) / `3002` (dashboard) | Server port |
| `NODE_ENV` | No | `development` | Environment |
| `LOG_LEVEL` | No | `info` | Pino log level |
| `CORS_ORIGIN` | No | — | Comma-separated allowed origins |

## Email

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RESEND_API_KEY` | No | — | Resend API key for email |
| `SMTP_HOST` | No | — | SMTP server host |
| `SMTP_PORT` | No | `587` | SMTP server port |
| `SMTP_USER` | No | — | SMTP username |
| `SMTP_PASS` | No | — | SMTP password |
| `SMTP_FROM` | No | — | Sender email address |

## Frontend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:3002` | Dashboard API URL (client-side) |
| `APP_URL` | No | `http://localhost:3000` | Frontend URL (for email links) |
| `INGESTION_API_URL` | No | `http://localhost:3001` | Ingestion API URL (for agent sync) |

## Sync

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SYNC_INTERVAL` | No | `300` | Sync interval in seconds |

## CLI

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AIINSIGHT_TZ` | No | — | Default timezone (overrides `--timezone`) |
| `AIINSIGHT_VERBOSE` | No | — | Enable verbose logging when set to `1` |

---

## Docker Compose Configuration

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: aiinsight
      POSTGRES_USER: aiinsight
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-aiinsight_secret}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  ingestion-api:
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://aiinsight:${POSTGRES_PASSWORD}@postgres:5432/aiinsight
      JWT_SECRET: ${JWT_SECRET}

  dashboard-api:
    ports:
      - "3002:3002"
    environment:
      DATABASE_URL: postgresql://aiinsight:${POSTGRES_PASSWORD}@postgres:5432/aiinsight
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGIN: http://localhost:3000

  dashboard-web:
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3002
```

---

## API Key Format

| Key Type | Prefix | Purpose |
|----------|--------|---------|
| Dashboard API Key | `aisk_XXXXXXXX_...` (new) or `cb_...` (legacy) | User authentication for sync engine |
| Enrollment Key | `ai_live_XXXXXXXX_...` | Agent registration |

---

## Rate Limiting Configuration

| Route | Limit | Window | Key |
|-------|-------|--------|-----|
| `/api/v1/auth/*` | 100 requests | 1 minute | IP address |
| `/api/v1/ingest/*` | 1000 requests | 1 minute | API key or IP |

---

## CORS Configuration

```typescript
// Dashboard API
cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : undefined,
  credentials: true,
})
```

Multiple origins:
```bash
CORS_ORIGIN=http://localhost:3000,https://app.aiinsight.dev
```

---

## Logging Configuration

All services use Pino for structured JSON logging.

| Level | Description |
|-------|-------------|
| `fatal` | System is unusable |
| `error` | Error conditions |
| `warn` | Warning conditions |
| `info` | Informational messages |
| `debug` | Debug-level messages |
| `trace` | Trace-level messages |

```bash
LOG_LEVEL=debug  # Verbose logging for troubleshooting
```

## Related Documentation

- [Setup](setup.md) — Local development setup
- [Deployment](../operations/deployment.md) — Production deployment
- [Docker](../operations/docker.md) — Docker configuration
