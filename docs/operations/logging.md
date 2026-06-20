# Logging

Logging configuration for AIInsight.

## Overview

All AIInsight services use Pino for structured JSON logging.

## Log Levels

| Level | Description |
|-------|-------------|
| `fatal` | System is unusable |
| `error` | Error conditions |
| `warn` | Warning conditions |
| `info` | Informational messages |
| `debug` | Debug-level messages |
| `trace` | Trace-level messages |

## Configuration

### Environment Variable

```bash
LOG_LEVEL=info  # Default
LOG_LEVEL=debug  # Verbose logging for troubleshooting
```

### Docker Compose

```yaml
environment:
  LOG_LEVEL: info
```

## Log Output

### JSON Format

All logs are output in JSON format for easy parsing:

```json
{
  "level": 30,
  "time": 1687245600000,
  "msg": "Server started",
  "port": 3001,
  "service": "ingestion-api"
}
```

### Human-Readable

For development, use `pino-pretty`:

```bash
npm run api:dev | npx pino-pretty
```

## Viewing Logs

### Docker

```bash
# View all logs
docker compose logs -f

# View specific service
docker compose logs -f ingestion-api

# View last 100 lines
docker compose logs --tail 100 ingestion-api

# View logs since time
docker compose logs --since 2h ingestion-api
```

### PM2 (Production)

```bash
# View logs
pm2 logs aiinsight-ingestion

# View specific service
pm2 logs aiinsight-dashboard-api
```

## Log Rotation

### Docker

Docker handles log rotation automatically. Configure in `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

### Systemd

For systemd services, configure in `/etc/systemd/system/aiinsight.service`:

```ini
[Service]
StandardOutput=journal
StandardError=journal
SyslogIdentifier=aiinsight
```

## Structured Logging

### Request Logging

All API requests are logged with:

- Method
- URL
- Status code
- Response time
- User agent

### Error Logging

Errors include:

- Error message
- Stack trace (in debug mode)
- Request context
- User context (if authenticated)

## Monitoring

### Log Aggregation

For production, consider:

- ELK Stack (Elasticsearch, Logstash, Kibana)
- Grafana Loki
- Datadog
- New Relic

### Alerting

Set up alerts for:

- `error` level logs
- `fatal` level logs
- High request latency
- Error rate spikes

## Related Documentation

- [Deployment](deployment.md) — Production deployment
- [Docker](docker.md) — Docker configuration
- [Health Checks](health-checks.md) — Health check endpoints
- [Monitoring](monitoring.md) — Monitoring setup
