# Monitoring

Monitoring setup for AIInsight.

## Overview

AIInsight provides metrics and health endpoints for monitoring.

## Metrics

### Available Metrics

| Metric | Description |
|--------|-------------|
| Request count | Total API requests |
| Request latency | Response time distribution |
| Error rate | Failed requests percentage |
| Sync jobs | Active and completed syncs |
| Database connections | Connection pool usage |

### Prometheus

AIInsight exposes Prometheus metrics at `/metrics`:

```bash
curl http://localhost:3002/api/v1/metrics
```

## Dashboards

### Grafana

Import the AIInsight Grafana dashboard:

1. Open Grafana
2. Go to Dashboards → Import
3. Upload `dashboards/aiinsight.json`
4. Configure Prometheus data source

### Dashboard Panels

- Request rate
- Error rate
- Response latency
- Database connections
- Sync job status

## Alerting

### Recommended Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| High Error Rate | > 5% errors | Warning |
| Very High Error Rate | > 10% errors | Critical |
| High Latency | p95 > 1s | Warning |
| Very High Latency | p95 > 5s | Critical |
| Service Down | Health check fails | Critical |
| Database Down | Connection fails | Critical |

### Alertmanager

Configure Alertmanager for Prometheus alerts:

```yaml
groups:
  - name: aiinsight
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High error rate detected
```

## Uptime Monitoring

### External Services

Use external monitoring services:

- UptimeRobot
- Pingdom
- StatusCake

### Health Check URLs

```
https://app.aiinsight.dev/health
https://api.aiinsight.dev/api/v1/health
https://ingest.aiinsight.dev/api/v1/health
```

## Log Monitoring

See [Logging](logging.md) for log aggregation setup.

## Related Documentation

- [Health Checks](health-checks.md) — Health check endpoints
- [Logging](logging.md) — Logging configuration
- [Deployment](deployment.md) — Production deployment
