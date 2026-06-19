# API Design

AIInsight has two APIs: the **Dashboard API** (port 3002) and the **Ingestion API** (port 3001).

---

## Conventions

### Base URLs

| API | Base URL | Purpose |
|-----|----------|---------|
| Dashboard API | `http://localhost:3002/api/v1` | Auth, orgs, analytics, agents |
| Ingestion API | `http://localhost:3001/api/v1` | Data ingestion |

### Versioning

All endpoints use `/api/v1/` prefix. Breaking changes will increment the version prefix.

### Request Format

- Content-Type: `application/json`
- Body limit: 10MB
- Validation: Zod schemas on all endpoints

### Response Envelope

All responses are JSON. Success responses return the data directly. Error responses follow:

```json
{
  "error": "Error message"
}
```

Validation errors include details:

```json
{
  "error": "Validation failed",
  "details": {
    "fieldErrors": { "email": ["Invalid email"] }
  }
}
```

### Authentication

Two authentication methods:

**JWT Bearer Token** (for user sessions):
```
Authorization: Bearer <jwt-token>
```

**API Key** (for machine-to-machine):
```
Authorization: Bearer <api-key>
```
or
```
X-API-Key: <api-key>
```

API key format: `cb_XXXXXXXX_YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY` (8 hex + 48 hex).

### Pagination

List endpoints support cursor-based pagination (planned). Currently return all results.

### Filtering

Analytics endpoints accept `period` query parameter:
- `24h` — Last 24 hours
- `7d` — Last 7 days (default)
- `30d` — Last 30 days
- `90d` — Last 90 days
- `1y` — Last year

Analytics list endpoints accept `limit` query parameter (default: 20).

### Rate Limiting

| API | Limit | Window |
|-----|-------|--------|
| Dashboard API `/auth/*` | 100 requests | 1 minute |
| Ingestion API `/ingest/*` | 1000 requests | 1 minute |

Rate limit headers:
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1640995200
```

---

## Dashboard API

### Auth Routes (`/api/v1/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | No | Create account + organization |
| POST | `/login` | No | Login, returns JWT + refresh token |
| POST | `/refresh` | No | Refresh access token |
| POST | `/logout` | Yes | Delete all refresh tokens |
| POST | `/verify-email` | No | Verify email with token |
| POST | `/resend-verification` | No | Resend verification email |
| POST | `/forgot-password` | No | Request password reset |
| POST | `/reset-password` | No | Reset password with token |
| POST | `/change-password` | Yes | Change password (requires current password) |

### Dashboard Routes (`/api/v1/dashboard`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/overview` | Yes | Aggregated usage stats |
| GET | `/providers` | Yes | Per-provider analytics |
| GET | `/models` | Yes | Per-model analytics |
| GET | `/users` | Yes | Per-user analytics |
| GET | `/projects` | Yes | Per-project analytics |
| GET | `/trends` | Yes | Time-series data |
| POST | `/backfill` | Yes (admin) | Trigger historical backfill |
| GET | `/organization` | Yes | Org overview with counts |
| GET | `/agents` | Yes | List machines |
| GET | `/sync-jobs` | Yes | Recent sync jobs |
| GET | `/onboarding` | Yes | Onboarding progress |

### Organization Routes (`/api/v1/organizations`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Yes | Create organization |
| GET | `/current` | Yes | Get current organization |
| PATCH | `/current` | Yes (admin) | Update organization |

### Team Routes (`/api/v1/teams`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Yes | List teams |
| POST | `/` | Yes (admin) | Create team |
| PATCH | `/:id` | Yes (admin) | Update team |
| DELETE | `/:id` | Yes (admin) | Delete team |
| POST | `/:id/members` | Yes (admin) | Add member |
| DELETE | `/:id/members/:userId` | Yes (admin) | Remove member |

### Invitation Routes (`/api/v1/invitations`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/accept` | **No** | Accept invitation (public) |
| POST | `/` | Yes (admin) | Create invitation |
| GET | `/` | Yes | List invitations |
| DELETE | `/:id` | Yes (admin) | Revoke invitation |
| POST | `/:id/resend` | Yes (admin) | Resend invitation email |

### Enrollment Key Routes (`/api/v1/enrollment-keys`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Yes (admin) | Generate enrollment key |
| GET | `/` | Yes | List enrollment keys |
| DELETE | `/:id` | Yes (admin) | Revoke enrollment key |
| POST | `/:id/rotate` | Yes (admin) | Rotate enrollment key |

### Agent Routes (`/api/v1/agents`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | Enrollment key | Register agent/machine |
| POST | `/heartbeat` | JWT | Agent heartbeat |
| GET | `/config` | Yes | Get agent config |
| GET | `/` | Yes | List agents |
| GET | `/:id` | Yes | Get agent detail |

### Session Routes (`/api/v1/sessions`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Yes | List sessions with filters |
| GET | `/:id` | Yes | Session detail with events |

### Machine Routes (`/api/v1/machines`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/:id` | Yes | Machine detail with metrics |

### API Key Routes (`/api/v1/api-keys`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Yes | List API keys |
| POST | `/` | Yes (admin) | Create API key |
| DELETE | `/:id` | Yes (admin) | Revoke API key |

### Health Routes (`/api/v1`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check |
| GET | `/version` | No | Version info |

---

## Ingestion API

### Ingestion Routes (`/api/v1/ingest`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/batch` | Yes | Batch upload (sessions + events) |
| POST | `/sessions` | Yes | Upload sessions only |
| POST | `/events` | Yes | Upload events only |

### Health Routes (`/api/v1`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check |

### OpenAPI Routes (`/api`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/openapi.json` | No | OpenAPI specification |

---

## RBAC Roles

| Role | Can Do |
|------|--------|
| `owner` | Everything |
| `admin` | Everything except org deletion |
| `org_admin` | Analytics, agents, sessions, teams, invitations |
| `member` | View analytics, view sessions |
| `user` | Default role for new registrations |

Middleware: `authMiddleware`, `adminOrAbove`, `orgAdminOnly`, `ownerOnly`
