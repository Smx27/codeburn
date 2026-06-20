# Deployment

Production deployment guide for AIInsight.

## Docker Compose

The recommended deployment method uses Docker Compose.

### Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `postgres` | `postgres:16-alpine` | 5432 | Database |
| `ingestion-api` | Custom build | 3001 | Data ingestion |
| `dashboard-api` | Custom build | 3002 | Backend API |
| `dashboard-web` | Custom build | 3000 | Frontend |

### Quick Start

```bash
# Clone and configure
git clone https://github.com/priya/aiinsight.git
cd aiinsight
cp .env.docker.example .env
# Edit .env with production values

# Start
docker compose up -d

# Run migrations
docker compose exec ingestion-api npm run migrate

# Verify
curl http://localhost:3002/api/v1/health
```

### Production Configuration

```bash
# .env
POSTGRES_PASSWORD=<strong-random-password>
JWT_SECRET=<strong-random-secret-32-chars-min>
```

### Health Checks

| Service | Endpoint | Expected |
|---------|----------|----------|
| PostgreSQL | `pg_isready -U aiinsight` | Exit code 0 |
| Ingestion API | `GET /api/v1/health` | `{ "status": "ok" }` |
| Dashboard API | `GET /api/v1/health` | `{ "status": "ok" }` |
| Dashboard Web | `GET /` | HTML response |

---

## Manual Deployment

### Prerequisites

- Node.js 22+
- PostgreSQL 16+
- npm

### Steps

```bash
# Install dependencies
npm install

# Build all packages
npm run sync:build
npm run analytics:build
npm run api:build
npm run dashboard-api:build
npm run dashboard-web:build

# Run migrations
npm run api:migrate

# Start services (in separate terminals)
npm run api:dev           # Ingestion API on :3001
npm run dashboard-api:dev # Dashboard API on :3002
npm run dashboard-web:dev # Dashboard Web on :3000
```

---

## Ports

| Port | Service | Protocol |
|------|---------|----------|
| 3000 | Dashboard Web | HTTP |
| 3001 | Ingestion API | HTTP |
| 3002 | Dashboard API | HTTP |
| 5432 | PostgreSQL | TCP |

---

## Environment Variables

See [Configuration](../architecture/configuration.md) for complete list.

### Required for Production

| Variable | Example |
|----------|---------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/aiinsight` |
| `JWT_SECRET` | `<random-32-char-string>` |
| `POSTGRES_PASSWORD` | `<strong-password>` |

### Optional for Production

| Variable | Default |
|----------|---------|
| `CORS_ORIGIN` | `http://localhost:3000` |
| `PORT` | 3001 (ingestion) / 3002 (dashboard) |
| `NODE_ENV` | `development` |
| `LOG_LEVEL` | `info` |

---

## Scaling Considerations

| Component | Scaling Strategy |
|-----------|-----------------|
| PostgreSQL | Vertical (more RAM/CPU) or read replicas |
| Ingestion API | Horizontal (stateless, rate limited by API key) |
| Dashboard API | Horizontal (stateless, JWT auth) |
| Dashboard Web | Horizontal (stateless, static build) |

## Related Documentation

- [Docker](docker.md) — Docker configuration
- [Environment](../developer/environment.md) — Environment variables
- [Health Checks](health-checks.md) — Health check endpoints
- [Logging](logging.md) — Logging configuration
