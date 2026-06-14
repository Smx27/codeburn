# Phase 03: Organization Onboarding & Tenant Management

## 1. Executive Summary

### What Was Built

AiInsight Phase 3 transforms the platform into a self-service SaaS product with full tenant lifecycle management:

- **User Registration & Authentication** — JWT auth with refresh token rotation, email verification, password reset
- **Organization Management** — Multi-tenant organizations with settings and team structure
- **Team Management** — Teams with role-based membership and access control
- **Invitation System** — Email-based invite flow with token-based acceptance
- **Agent Enrollment** — Enrollment keys for machine registration with heartbeat tracking
- **Onboarding Wizard** — Step-by-step guide for new organizations
- **Enhanced Dashboard** — Org overview, agent status, sync jobs, onboarding progress
- **Email System** — Mail service abstraction (Resend + SMTP) with 6 templates
- **Landing Page & Marketing** — Public marketing site and getting-started wizard
- **Documentation** — 6 product guides and support runbook

### Why It Was Built

Phase 2 delivered analytics dashboards, but the platform lacked:
- **Self-service onboarding** — No way for new teams to sign up and start using the product
- **Multi-tenancy** — No organization isolation or team management
- **Agent registration** — No secure way to connect agents to organizations
- **User management** — No invitations, roles, or access control
- **Email communication** — No verification, notifications, or password reset

### Business Objective

Enable AiInsight Cloud as a self-service SaaS product where:
- Teams can sign up, invite members, and start tracking AI usage in minutes
- Organization owners have full control over teams, keys, and access
- Agents can be securely registered and managed at scale
- The platform supports enterprise-grade tenant isolation

### Technical Objective

Build a complete tenant lifecycle that:
- Supports multi-tenant isolation from registration through analytics
- Provides secure agent enrollment with key-based authentication
- Enables role-based access control across organizations and teams
- Maintains audit trails for compliance and security

### Problems Solved

1. **No Self-Service** — Teams couldn't sign up without manual provisioning
2. **No Multi-Tenancy** — No organization isolation or team structure
3. **No Agent Security** — No secure way to register and authenticate agents
4. **No User Management** — No invitations, roles, or access control
5. **No Email Communication** — No verification, notifications, or password reset

---

## 2. Scope of This Phase

### Phase 3 (Weeks 1-2): Backend Foundation

| Feature | Status |
|---------|--------|
| User registration with JWT + refresh token rotation | ✅ Complete |
| Login/logout with token management | ✅ Complete |
| Email verification flow (24h expiry) | ✅ Complete |
| Password reset flow (1h expiry) | ✅ Complete |
| Organization CRUD with settings | ✅ Complete |
| Team management with role-based membership | ✅ Complete |
| Invitation system with 7-day token expiry | ✅ Complete |
| Enrollment key generation and management | ✅ Complete |
| Agent registration and heartbeat tracking | ✅ Complete |
| Ingestion API auth middleware | ✅ Complete |
| Mail service abstraction (Resend + SMTP) | ✅ Complete |
| 6 email templates (welcome, verify, reset, invite, agent-connected, team-join) | ✅ Complete |
| Database migration (011_phase3_schema.sql) | ✅ Complete |

### Phase 3.5 (Weeks 3-4): Frontend & Activation

| Feature | Status |
|---------|--------|
| Landing page and marketing site | ✅ Complete |
| Getting-started wizard (6 steps) | ✅ Complete |
| Agent setup page | ✅ Complete |
| Enhanced dashboard (org overview, agent status, sync jobs) | ✅ Complete |
| Onboarding progress widget | ✅ Complete |
| Empty state dashboard | ✅ Complete |
| Seed data system (100K events) | ✅ Complete |
| Documentation (6 guides, support runbook) | ✅ Complete |

### Excluded

| Feature | Reason |
|---------|--------|
| SSO/SAML authentication | Phase 04 — enterprise feature |
| Usage-based billing | Phase 04 — subscription management |
| API rate limiting | Phase 04 — public API protection |
| Real-time WebSocket updates | Phase 04 — live data streaming |
| Mobile app | Phase 05 — responsive web first |
| Audit logging | Phase 04 — compliance feature |

### Future Dependencies

- **Phase 04**: SSO/SAML, billing integration, audit logging, rate limiting
- **Phase 05**: Mobile app, Slack/Teams integrations, real-time streaming

---

## 3. Architecture Overview

### High-Level Architecture

```mermaid
flowchart TB
    subgraph "User Browser"
        DW[Dashboard Web<br/>Next.js 15]
        LP[Landing Page]
        GW[Getting Started Wizard]
    end

    subgraph "Cloud Infrastructure"
        DA[Dashboard API<br/>Express + TypeScript]
        IA[Ingestion API<br/>Express + TypeScript]
        MS[Mail Service<br/>Resend + SMTP]
        DB[(PostgreSQL)]
    end

    subgraph "Developer Machines"
        AG[Agent<br/>CLI Tool]
        SE[Sync Engine]
    end

    DW -->|HTTP| DA
    LP -->|HTTP| DA
    GW -->|HTTP| DA
    DA -->|queries| DB
    DA -->|sends email| MS
    IA -->|stores events| DB
    AG -->|enrollment key| DA
    AG -->|agent token| DA
    AG -->|sync events| IA
    SE -->|upload| IA
```

### Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant DW as Dashboard Web
    participant DA as Dashboard API
    participant DB as PostgreSQL
    participant MS as Mail Service

    Note over U,MS: Registration
    U->>DW: Register (email, password, org name)
    DW->>DA: POST /api/v1/auth/register
    DA->>DB: Create org, user, default team
    DA->>MS: Send welcome email
    DA->>MS: Send verification email
    DA-->>DW: JWT (24h) + Refresh Token (30d)
    U->>DW: Click verification link
    DW->>DA: POST /api/v1/auth/verify
    DA->>DB: Mark email verified

    Note over U,MS: Login
    U->>DW: Login (email, password)
    DW->>DA: POST /api/v1/auth/login
    DA->>DB: Validate credentials
    DA-->>DW: JWT + Refresh Token
    DW->>DW: Store in context

    Note over U,MS: Token Refresh
    DW->>DA: POST /api/v1/auth/refresh
    DA->>DB: Validate refresh token
    DA-->>DW: New JWT + Refresh Token
```

### Agent Registration Flow

```mermaid
sequenceDiagram
    participant O as Org Owner
    participant DW as Dashboard Web
    participant DA as Dashboard API
    participant DB as PostgreSQL
    participant A as Agent
    participant MS as Mail Service

    O->>DW: Create enrollment key
    DW->>DA: POST /api/v1/enrollment-keys
    DA->>DB: Store key hash
    DA-->>DW: Return enrollment key

    A->>DA: POST /api/v1/agents/register
    Note right of A: enrollment key + hostname + OS
    DA->>DB: Validate key, create machine
    DA->>MS: Send agent-connected email
    DA-->>A: Agent token + sync interval

    loop Every 5 minutes
        A->>DA: POST /api/v1/agents/heartbeat
        DA->>DB: Update last_seen, status
        DA-->>A: OK
    end
```

### Invitation Flow

```mermaid
sequenceDiagram
    participant A as Admin
    participant DW as Dashboard Web
    participant DA as Dashboard API
    participant DB as PostgreSQL
    participant MS as Mail Service
    participant I as Invitee

    A->>DW: Send invitation
    DW->>DA: POST /api/v1/invitations
    DA->>DB: Store invitation token (7d expiry)
    DA->>MS: Send invitation email
    DA-->>A: Invitation created

    I->>DW: Click invitation link
    DW->>DA: POST /api/v1/invitations/accept
    DA->>DB: Create user, add to org + team
    DA-->>I: JWT token
    I->>DW: Logged in to organization
```

### Invitation Flow

```mermaid
sequenceDiagram
    participant A as Admin
    participant DW as Dashboard Web
    participant DA as Dashboard API
    participant DB as PostgreSQL
    participant MS as Mail Service
    participant I as Invitee

    A->>DW: Send invitation
    DW->>DA: POST /api/v1/invitations
    DA->>DB: Store invitation token (7d expiry)
    DA->>MS: Send invitation email
    DA-->>A: Invitation created

    I->>DW: Click invitation link
    DW->>DA: POST /api/v1/invitations/accept
    DA->>DB: Create user, add to org + team
    DA-->>I: JWT token
    I->>DW: Logged in to organization
```

---

## 4. Database Schema Changes

### New Tables (Migration 011)

```sql
-- Organization settings
CREATE TABLE organization_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency VARCHAR(3) DEFAULT 'USD',
    retention_days INTEGER DEFAULT 90,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id)
);

-- Teams
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team membership
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Invitations
CREATE TABLE organization_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'member',
    token VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enrollment keys
CREATE TABLE organization_enrollment_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    prefix VARCHAR(20) NOT NULL,
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync jobs
CREATE TABLE sync_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    sessions_synced INTEGER DEFAULT 0,
    events_synced INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refresh tokens
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email verification
CREATE TABLE email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Password reset
CREATE TABLE password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent tokens
CREATE TABLE agent_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Schema Relationships

```
organizations
├── organization_settings (1:1)
├── users (1:N)
│   └── team_members (N:M with teams)
├── teams (1:N)
│   └── team_members (N:M with users)
├── machines (1:N)
│   ├── sync_jobs (1:N)
│   └── agent_tokens (1:N)
├── organization_enrollment_keys (1:N)
├── organization_invitations (1:N)
└── api_keys (1:N)

refresh_tokens, email_verifications, password_resets (linked to users)
```

---

## 5. API Endpoints Added

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | None | Register user + organization |
| POST | `/login` | None | Login with email/password |
| POST | `/refresh` | None | Refresh JWT token |
| POST | `/logout` | JWT | Logout (invalidate refresh tokens) |
| POST | `/verify-email` | None | Verify email with token |
| POST | `/resend-verification` | None | Resend verification email |
| POST | `/forgot-password` | None | Request password reset |
| POST | `/reset-password` | None | Reset password with token |
| POST | `/change-password` | JWT | Change password (current + new) |

### Organizations (`/api/v1/organizations`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | JWT | Create organization |
| GET | `/current` | JWT | Get current organization |
| PATCH | `/current` | JWT (admin+) | Update organization |

### Teams (`/api/v1/teams`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | JWT | List teams |
| POST | `/` | JWT (admin+) | Create team |
| PATCH | `/:id` | JWT (admin+) | Update team |
| DELETE | `/:id` | JWT (admin+) | Delete team |
| POST | `/:id/members` | JWT (admin+) | Add member |
| DELETE | `/:id/members/:userId` | JWT (admin+) | Remove member |

### Invitations (`/api/v1/invitations`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | JWT (admin+) | Send invitation |
| GET | `/` | JWT | List invitations |
| POST | `/accept` | None | Accept invitation |
| DELETE | `/:id` | JWT (admin+) | Revoke invitation |
| POST | `/:id/resend` | JWT (admin+) | Resend invitation |

### Enrollment Keys (`/api/v1/enrollment-keys`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | JWT (admin+) | Generate key |
| GET | `/` | JWT | List keys |
| DELETE | `/:id` | JWT (admin+) | Revoke key |
| POST | `/:id/rotate` | JWT (admin+) | Rotate key |

### Agents (`/api/v1/agents`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | Enrollment Key | Register agent |
| POST | `/heartbeat` | Agent Token | Send heartbeat |
| GET | `/` | JWT | List agents |
| GET | `/:id` | JWT | Get agent details |

### Dashboard (`/api/v1/dashboard`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/overview` | JWT | Overview stats |
| GET | `/providers` | JWT | Provider analytics |
| GET | `/models` | JWT | Model analytics |
| GET | `/users` | JWT | User analytics |
| GET | `/projects` | JWT | Project analytics |
| GET | `/trends` | JWT | Time series |
| GET | `/organization` | JWT | Org overview |
| GET | `/agents` | JWT | Agent dashboard |
| GET | `/sync-jobs` | JWT | Sync jobs |
| GET | `/onboarding` | JWT | Onboarding status |

### Onboarding (`/api/v1/onboarding`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | JWT | Get onboarding progress |
| PATCH | `/` | JWT | Update onboarding step |

---

## 6. Frontend Pages Added

### Public Pages

| Page | Path | Description |
|------|------|-------------|
| Landing Page | `/` | Marketing page with features, pricing, CTA |
| Login | `/login` | Email/password login with invitation support |
| Register | `/register` | User registration with organization creation |
| Forgot Password | `/forgot-password` | Password reset request |
| Reset Password | `/reset-password` | Password reset with token |
| Verify Email | `/verify-email` | Email verification with token |

### Authenticated Pages

| Page | Path | Description |
|------|------|-------------|
| Getting Started | `/getting-started` | 6-step onboarding wizard |
| Dashboard | `/dashboard` | Overview with hero metrics, trends, breakdowns |
| Providers | `/providers` | Per-provider analytics |
| Models | `/models` | Model distribution and costs |
| Users | `/users` | Team activity and leaderboards |
| Projects | `/projects` | Project cost attribution |
| Trends | `/trends` | Historical usage patterns |
| Settings | `/settings` | Organization settings, teams, members |
| Agent Setup | `/settings/agents` | Enrollment keys, machines, install commands |

### Onboarding Wizard Steps

1. **Organization** — Create or confirm organization name
2. **Enrollment Key** — Generate and save enrollment key
3. **Install Agent** — Platform-specific install commands
4. **Register Agent** — Connect agent with enrollment key
5. **Verify Sync** — Confirm agents are connected and syncing
6. **Invite Team** — Send invitations to team members

---

## 7. Email Templates

| Template | Trigger | Subject |
|----------|---------|---------|
| Welcome | Registration | Welcome to AIInsight, {name}! |
| Verify Email | Registration | Verify your email address |
| Password Reset | Forgot password | Reset your password |
| Invitation | Team invite | Join {org} on AIInsight |
| Agent Connected | Agent registration | New agent connected: {machine} |
| Team Join | Invitation accepted | Welcome to {org} |

### Mail Service Abstraction

```typescript
// Provider selection
const provider = process.env.RESEND_API_KEY ? 'resend' : 'smtp';

// Resend configuration
RESEND_API_KEY=re_xxxxx

// SMTP configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## 8. Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | Yes |
| `RESEND_API_KEY` | Resend email API key | No (uses SMTP) |
| `SMTP_HOST` | SMTP server host | No (uses Resend) |
| `SMTP_PORT` | SMTP server port | No (default: 587) |
| `SMTP_USER` | SMTP username | No |
| `SMTP_PASS` | SMTP password | No |
| `DASHBOARD_URL` | Frontend URL for links | No (default: http://localhost:3000) |
| `API_URL` | API URL for agent config | No (default: http://localhost:3002) |

### Docker Compose

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: aiinsight
      POSTGRES_USER: aiinsight
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"

  ingestion-api:
    build: apps/ingestion-api
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://aiinsight:${POSTGRES_PASSWORD}@postgres:5432/aiinsight
    depends_on:
      postgres:
        condition: service_healthy

  dashboard-api:
    build: apps/dashboard-api
    ports:
      - "3002:3002"
    environment:
      DATABASE_URL: postgresql://aiinsight:${POSTGRES_PASSWORD}@postgres:5432/aiinsight
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      RESEND_API_KEY: ${RESEND_API_KEY:-}
      SMTP_HOST: ${SMTP_HOST:-}
      SMTP_PORT: ${SMTP_PORT:-587}
      SMTP_USER: ${SMTP_USER:-}
      SMTP_PASS: ${SMTP_PASS:-}
    depends_on:
      postgres:
        condition: service_healthy

  dashboard-web:
    build: apps/dashboard-web
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3002
    depends_on:
      - dashboard-api
```

---

## 9. Testing Approach

### Unit Tests

- Authentication flows (register, login, refresh, logout)
- Email verification and password reset
- Organization and team CRUD
- Invitation lifecycle
- Enrollment key management
- Agent registration and heartbeat

### Integration Tests

- Complete registration → onboarding → agent setup flow
- Invitation → acceptance → team membership flow
- Agent registration → heartbeat → sync flow
- Multi-tenant isolation verification

### Seed Data System

```bash
# Development seed (100K events)
npm run dev:setup-org

# Small dataset (10K events)
pnpm seed:small

# Medium dataset (100K events)
pnpm seed:medium

# Large dataset (1M events)
pnpm seed:large
```

The seed system creates:
- 1 organization with settings
- 5 users (owner, admin, member1-3)
- 3 teams (Platform, AI, Security)
- 3 enrollment keys
- 10 machines (mix of OS)
- 20 sample sessions
- Pre-aggregated daily usage data

---

## 10. Known Limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| No SSO/SAML | Enterprise teams must use email/password | Use email/password for now |
| No bulk invitations | Must invite one user at a time | Contact support for bulk |
| No usage-based billing | Cannot charge per-seat or per-event | Manual billing |
| No real-time updates | Dashboard requires refresh | Refresh manually |
| No API rate limiting | Public API vulnerable to abuse | Use API keys |
| No audit logging | No compliance trail | Manual tracking |

---

## 11. Future Improvements

### Phase 04 (Planned)

- SSO/SAML authentication
- Usage-based billing and subscriptions
- Audit logging for compliance
- API rate limiting and quotas
- Real-time WebSocket updates
- Email notification preferences

### Phase 05 (Planned)

- Mobile app (iOS/Android)
- Slack/Teams integrations
- Custom dashboards
- Data export API
- Webhook support

---

## 12. Related Documentation

- [Architecture](../architecture.md) — System design overview
- [Developer Setup](../dev-setup.md) — Local development guide
- [Phase 01: Cloud Foundation](phase-01-cloud-foundation.md) — Sync engine and ingestion API
- [Phase 02: Analytics Dashboard](phase-02-analytics-dashboard.md) — Analytics engine and dashboard
- [Product Documentation](../product/README.md) — User-facing documentation
