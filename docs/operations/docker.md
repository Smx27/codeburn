# Docker

Docker configuration for AIInsight.

## Overview

AIInsight provides Docker Compose configuration for easy deployment.

## docker-compose.yml

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: aiinsight
      POSTGRES_USER: aiinsight
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-aiinsight_secret}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U aiinsight"]
      interval: 5s
      timeout: 5s
      retries: 5

  ingestion-api:
    build:
      context: .
      dockerfile: apps/ingestion-api/Dockerfile
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://aiinsight:${POSTGRES_PASSWORD:-aiinsight_secret}@postgres:5432/aiinsight
      PORT: 3001
      NODE_ENV: production
      LOG_LEVEL: info
      JWT_SECRET: ${JWT_SECRET:-change-this-in-production}
    depends_on:
      postgres:
        condition: service_healthy

  dashboard-api:
    build:
      context: .
      dockerfile: apps/dashboard-api/Dockerfile
    restart: unless-stopped
    ports:
      - "3002:3002"
    environment:
      DATABASE_URL: postgresql://aiinsight:${POSTGRES_PASSWORD:-aiinsight_secret}@postgres:5432/aiinsight
      PORT: 3002
      NODE_ENV: production
      LOG_LEVEL: info
      JWT_SECRET: ${JWT_SECRET:-change-this-in-production}
      CORS_ORIGIN: http://localhost:3000
      APP_URL: ${APP_URL:-http://localhost:3000}
      INGESTION_API_URL: http://ingestion-api:3001
      MAIL_PROVIDER: ${MAIL_PROVIDER:-resend}
      RESEND_API_KEY: ${RESEND_API_KEY:-}
    depends_on:
      postgres:
        condition: service_healthy

  dashboard-web:
    build:
      context: .
      dockerfile: apps/dashboard-web/Dockerfile
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3002
    depends_on:
      - dashboard-api

volumes:
  postgres_data:
```

## Commands

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Stop and delete data
docker compose down -v

# Rebuild after changes
docker compose up --build -d

# Run migrations
docker compose exec ingestion-api npm run migrate

# Seed test data
docker compose exec ingestion-api npx tsx scripts/seeds/seed-dev-org.ts
```

## Environment Variables

See [.env.docker.example](../../.env.docker.example) for template.

## Health Checks

```bash
# PostgreSQL
docker compose exec postgres pg_isready -U aiinsight

# Ingestion API
curl http://localhost:3001/api/v1/health

# Dashboard API
curl http://localhost:3002/api/v1/health

# Dashboard Web
curl http://localhost:3000
```

## Troubleshooting

### Container won't start

1. Check logs: `docker compose logs <service>`
2. Verify environment variables in `.env`
3. Ensure ports are not in use

### Database connection issues

1. Check PostgreSQL is running: `docker compose ps`
2. Verify `DATABASE_URL` is correct
3. Check PostgreSQL logs: `docker compose logs postgres`

### Migration failures

1. Ensure database is accessible
2. Check migration files for syntax errors
3. Manually run migrations if needed

## Related Documentation

- [Deployment](deployment.md) — Production deployment
- [Environment](../developer/environment.md) — Environment variables
- [Health Checks](health-checks.md) — Health check endpoints
