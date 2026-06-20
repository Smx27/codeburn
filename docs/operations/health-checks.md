# Health Checks

Health check endpoints for AIInsight services.

## Endpoints

| Service | Endpoint | Expected Response |
|---------|----------|-------------------|
| PostgreSQL | `pg_isready -U aiinsight` | Exit code 0 |
| Ingestion API | `GET /api/v1/health` | `{ "status": "ok" }` |
| Dashboard API | `GET /api/v1/health` | `{ "status": "ok" }` |
| Dashboard Web | `GET /` | HTML response |

## Health Check Details

### Ingestion API

```bash
curl http://localhost:3001/api/v1/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-06-20T12:00:00Z"
}
```

### Dashboard API

```bash
curl http://localhost:3002/api/v1/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-06-20T12:00:00Z"
}
```

### Dashboard Web

```bash
curl http://localhost:3000
```

**Response:** HTML page (200 OK)

### Version Endpoint

```bash
curl http://localhost:3002/api/v1/version
```

**Response:**
```json
{
  "version": "1.0.0",
  "name": "aiinsight-dashboard-api"
}
```

## Docker Health Checks

Docker Compose includes health checks for PostgreSQL:

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U aiinsight"]
  interval: 5s
  timeout: 5s
  retries: 5
```

## Monitoring

### Simple Monitoring Script

```bash
#!/bin/bash
# monitor.sh

services=(
  "http://localhost:3000:Dashboard Web"
  "http://localhost:3001/api/v1/health:Ingestion API"
  "http://localhost:3002/api/v1/health:Dashboard API"
)

for service in "${services[@]}"; do
  url=$(echo $service | cut -d: -f1-2)
  name=$(echo $service | cut -d: -f3)
  
  if curl -s $url > /dev/null; then
    echo "✓ $name is healthy"
  else
    echo "✗ $name is unhealthy"
  fi
done
```

### Docker Health Check

```bash
# Check all containers
docker compose ps

# Check specific container
docker compose ps ingestion-api
```

## Troubleshooting

### Health check fails

1. Check service is running: `docker compose ps`
2. Check service logs: `docker compose logs <service>`
3. Verify port is accessible: `curl http://localhost:<port>`
4. Check database connectivity

### Service unhealthy

1. Check resource usage: `docker stats`
2. Check disk space: `df -h`
3. Check memory usage: `free -m`
4. Restart service: `docker compose restart <service>`

## Related Documentation

- [Deployment](deployment.md) — Production deployment
- [Docker](docker.md) — Docker configuration
- [Logging](logging.md) — Logging configuration
