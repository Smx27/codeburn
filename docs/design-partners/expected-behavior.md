# Expected Behavior

What to expect from AIInsight as a design partner.

## Overview

AIInsight tracks your AI coding usage and provides cost visibility. This document describes what you should expect from the product.

## CLI Behavior

### Commands

| Command | Expected Behavior |
|---------|-------------------|
| `aiinsight --version` | Shows version number |
| `aiinsight --help` | Shows help text |
| `aiinsight report` | Shows interactive dashboard |
| `aiinsight today` | Shows today's usage |
| `aiinsight month` | Shows month's usage |
| `aiinsight export` | Exports data to CSV/JSON |
| `aiinsight status` | Shows compact status |
| `aiinsight optimize` | Shows optimization tips |
| `aiinsight providers` | Lists detected providers |
| `aiinsight doctor` | Runs diagnostics |
| `aiinsight config` | Shows configuration |
| `aiinsight login` | Connects to cloud |
| `aiinsight logout` | Disconnects from cloud |
| `aiinsight sync` | Syncs data to cloud |

### Output

CLI output should be:
- **Clean** — Easy to read
- **Informative** — Shows relevant data
- **Fast** — Completes in seconds
- **Reliable** — Consistent results

### Errors

When errors occur, you should see:
- **Clear message** — What went wrong
- **Actionable advice** — How to fix it
- **Helpful context** — Relevant information

## Dashboard Behavior

### Pages

| Page | Expected Behavior |
|------|-------------------|
| Landing | Shows product overview |
| Login | Authenticates user |
| Register | Creates new account |
| Dashboard | Shows overview analytics |
| Providers | Shows per-provider breakdown |
| Models | Shows per-model breakdown |
| Users | Shows per-user breakdown |
| Projects | Shows per-project breakdown |
| Trends | Shows time series data |
| Settings | Manages organization |

### Performance

- **Page load:** < 3 seconds
- **Chart render:** < 2 seconds
- **Table load:** < 2 seconds
- **Form submit:** < 1 second

### Data

Dashboard data should be:
- **Accurate** — Correct calculations
- **Timely** — Updated hourly
- **Complete** — All data shown
- **Consistent** — Same data across pages

## Sync Behavior

### What Gets Synced

| Data | Synced | Notes |
|------|--------|-------|
| Session metadata | ✅ | Session ID, provider, timestamps |
| Token counts | ✅ | Input, output, cache |
| Cost estimates | ✅ | Calculated from pricing |
| Model names | ✅ | Which model was used |
| Project names | ✅ | Directory name |
| Machine info | ✅ | Hostname, OS, architecture |

### What Never Gets Synced

| Data | Synced | Notes |
|------|--------|-------|
| Prompts | ❌ | Privacy |
| Code | ❌ | Privacy |
| Responses | ❌ | Privacy |
| File contents | ❌ | Privacy |
| Credentials | ❌ | Security |

### Sync Flow

1. **Discovery** — Find provider session files
2. **Parsing** — Extract usage data
3. **Deduplication** — Skip already-synced data
4. **Upload** — Send to cloud API
5. **Aggregation** — Calculate daily summaries

### Timing

- **Historical sync:** First sync uploads all existing data
- **Incremental sync:** Subsequent syncs upload only new data
- **Sync interval:** Default 5 minutes (configurable)
- **Aggregation:** Hourly for yesterday's data

## API Behavior

### Endpoints

| Endpoint | Method | Expected Response |
|----------|--------|-------------------|
| `/api/v1/health` | GET | `{"status":"ok"}` |
| `/api/v1/version` | GET | Version info |
| `/api/v1/auth/register` | POST | User + tokens |
| `/api/v1/auth/login` | POST | Tokens |
| `/api/v1/dashboard/overview` | GET | Overview data |
| `/api/v1/ingest/batch` | POST | Ingestion result |

### Authentication

- **JWT tokens:** 24-hour expiry
- **Refresh tokens:** 30-day expiry
- **API keys:** No expiry (until revoked)

### Rate Limiting

- **Auth routes:** 100 requests/minute
- **Ingestion routes:** 1000 requests/minute

## Reliability

### Uptime Target

- **SLA:** 99.9% uptime
- **Planned downtime:** Announced 48 hours in advance
- **Unplanned downtime:** Status page updated immediately

### Data Durability

- **Backups:** Daily
- **Retention:** 30 days minimum
- **Recovery:** < 1 hour RTO

## What's NOT Expected

### Current Limitations

1. **Real-time sync** — Sync runs on interval
2. **Prompt storage** — By design for privacy
3. **Multi-org support** — Single org per user
4. **Mobile dashboard** — Desktop optimized
5. **Offline mode** — Requires network

### Future Features

See [Roadmap](../roadmap.md) for planned features.

## Related Documentation

- [Onboarding](onboarding.md) — Getting started
- [Known Limitations](known-limitations.md) — Current limitations
- [FAQ](../getting-started/faq.md) — Common questions
