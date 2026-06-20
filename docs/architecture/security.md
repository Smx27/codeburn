# Security

---

## Authentication

### JWT Tokens

- Algorithm: HS256
- Expiry: 24 hours
- Secret: `JWT_SECRET` environment variable (required, no fallback)
- Payload: `sub` (user ID), `email`, `name`, `orgId`, `role`, `machineId` (optional)

### Refresh Tokens

- Expiry: 30 days
- Stored as SHA-256 hash in database
- Full rotation on use (old token deleted, new token issued)
- All refresh tokens for a user deleted on logout or password reset

### API Keys

- Format: `aisk_XXXXXXXX_YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY` (new keys) or `cb_...` (legacy)
- Prefix: `aisk_` or `cb_` + 8 hex characters (used for lookup)
- Full key shown only on creation (one-time secret)
- Stored as Argon2 hash
- Role-based: `read`, `write`, `admin`
- Optional expiry

### Enrollment Keys

- Format: `ai_live_XXXXXXXX_YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY`
- Used for agent registration only
- Stored as Argon2 hash
- Optional expiry
- Can be revoked or rotated

### Password Hashing

- Algorithm: Argon2
- Used for user passwords and API keys
- No development fallbacks — passwords must be set by users

---

## Authorization (RBAC)

### Roles

| Role | Description |
|------|-------------|
| `owner` | Full access, can delete organization |
| `admin` | Full access except org deletion |
| `org_admin` | Analytics, agents, sessions, teams, invitations |
| `member` | View analytics, view sessions |
| `user` | Default role |

### Middleware

| Middleware | Access |
|------------|--------|
| `authMiddleware` | Any authenticated user |
| `adminOrAbove` | `owner`, `admin`, `org_admin` |
| `orgAdminOnly` | `owner`, `admin`, `org_admin` |
| `ownerOnly` | `owner` only |

---

## Tenant Isolation

Every database query filters by `organization_id`. There is no cross-organization data access.

```sql
-- Example: All queries include org filter
SELECT * FROM sessions WHERE organization_id = $1
SELECT * FROM events WHERE organization_id = $1
SELECT * FROM users WHERE organization_id = $1
```

Users belong to exactly one organization. Machines, sessions, events, teams, and API keys are all scoped to an organization.

---

## Rate Limiting

| Route | Limit | Window | Key |
|-------|-------|--------|-----|
| `/api/v1/auth/*` | 100 requests | 1 minute | IP address |
| `/api/v1/ingest/*` | 1000 requests | 1 minute | API key or IP |

Rate limit responses:
```json
HTTP 429
{
  "error": "Rate limit exceeded. Please try again later."
}
```

Standard headers included:
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1640995200
```

---

## Helmet

Both APIs use [helmet](https://helmetjs.github.io/) middleware for HTTP security headers:

```
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## CORS

Dashboard API CORS is configured via `CORS_ORIGIN` environment variable:

```typescript
cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : undefined,
  credentials: true,
})
```

Multiple origins supported: `CORS_ORIGIN=http://localhost:3000,https://app.aiinsight.dev`

---

## Secrets Management

| Secret | Required | Notes |
|--------|----------|-------|
| `JWT_SECRET` | **Yes** | App fails to start if missing |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string |
| `CORS_ORIGIN` | No | Comma-separated allowed origins |
| `RESEND_API_KEY` | No | For email via Resend |
| `SMTP_HOST` | No | For email via SMTP |
| `SMTP_USER` | No | SMTP credentials |
| `SMTP_PASS` | No | SMTP credentials |

**No development fallbacks.** All secrets must be explicitly set.

---

## Password Reset Flow

1. User requests reset via `POST /auth/forgot-password`
2. System generates random token, stores SHA-256 hash in `password_resets` table
3. System sends reset link via email (1 hour expiry)
4. User submits new password via `POST /auth/reset-password`
5. System verifies token hash, updates password, invalidates all refresh tokens

---

## Email Verification Flow

1. On registration, system generates random token, stores in `email_verifications` table
2. System sends verification link via email (24 hour expiry)
3. User clicks link, system verifies token, marks `email_verified = TRUE`
4. Tokens are single-use; re-verification generates new token

---

## Security Considerations

- Invitation tokens are not returned in list endpoints (removed from `GET /invitations` response)
- API keys are only shown once on creation
- Refresh tokens are rotated on every use
- All auth tokens are hashed before storage
- No plaintext secrets in database
- Rate limiting prevents brute force attacks
- Helmet provides standard HTTP security headers
- Tenant isolation prevents cross-organization data access
