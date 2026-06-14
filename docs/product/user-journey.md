# User Journey

Complete user lifecycle from visitor to active customer.

---

## Journey Overview

```mermaid
graph TD
    A[Visitor] -->|Lands on /| B[Marketing Page]
    B -->|Clicks Start Free| C[Registration]
    C -->|Creates Account| D[Email Verification]
    D -->|Verifies Email| E[Dashboard - First Login]
    E -->|Onboarding Wizard| F[Create Organization]
    F -->|Step 2| G[Generate Enrollment Key]
    G -->|Step 3| H[Install Agent]
    H -->|Step 4| I[Register Agent]
    I -->|Step 5| J[Historical Sync]
    J -->|Step 6| K[Invite Team]
    K --> L[Dashboard Activated]
    L --> M[Daily Usage]
    M --> N[Invite More Users]
    N --> O[Organization Growth]
```

---

## Stage 1: Visitor

**Goal:** Understand AIInsight's value proposition

**Touchpoints:**
- Marketing page (landing page)
- Documentation
- Blog/content

**User Actions:**
- Reads about AI analytics features
- Reviews pricing/plans
- Clicks "Start Free" or "Get Started"

**Success Metric:** Visitor clicks registration CTA

---

## Stage 2: Signup

**Goal:** Create an account and organization

**Sequence Diagram:**

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Dashboard API
    participant M as Mail Provider

    U->>F: Fill registration form
    F->>A: POST /api/auth/register
    A->>A: Create organization
    A->>A: Create user (role: owner)
    A->>A: Create default team
    A->>A: Generate JWT + refresh token
    A->>M: Send welcome email
    A->>M: Send verification email
    A-->>F: 201 { token, refreshToken, user }
    F->>F: Store tokens
    F-->>U: Redirect to dashboard
```

**Fields Required:**
- Email (required, unique)
- Password (required, min 8 characters)
- Name (optional)
- Organization Name (required)

**Backend Actions (auth.controller.ts:4-28):**
1. Validate input fields
2. Check password length >= 8
3. Call `dashboardService.register()`
4. Create organization and settings
5. Create user with `owner` role
6. Create default "General" team
7. Generate email verification token
8. Send welcome email
9. Return JWT + refresh token

**What Gets Created:**
- Organization record
- Organization settings (default timezone, currency, retention)
- User record (role: `owner`)
- Default team ("General")
- Team membership (user as `admin` of General team)
- Refresh token (30-day expiry)
- Email verification token (24-hour expiry)

---

## Stage 3: Email Verification

**Goal:** Verify email address to activate account

**Sequence Diagram:**

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Dashboard API
    participant DB as Database

    U->>F: Clicks verification link in email
    F->>A: POST /api/auth/verify-email
    A->>DB: Look up token
    A->>A: Check expiration
    A->>DB: Mark user email_verified = TRUE
    A->>DB: Delete used verification tokens
    A-->>F: 200 { success: true }
    F-->>U: Email verified, full access
```

**Token Flow:**
- Token generated: 32-byte random hex
- Stored in `email_verifications` table
- Expires after 24 hours
- Single-use (deleted after verification)

**Resend Verification:**
- `POST /api/auth/resend-verification` with email
- Deletes old tokens, generates new one
- Returns success regardless of whether user exists

---

## Stage 4: First Login & Onboarding

**Goal:** Complete initial setup through wizard

**Onboarding Steps:**

| Step | Action | Database Check |
|------|--------|----------------|
| 1 | Organization created | `organizations` row exists |
| 2 | Generate enrollment key | `organization_enrollment_keys` has rows |
| 3 | Install agent on machine | Agent binary downloaded |
| 4 | Register agent | `machines` row created |
| 5 | Historical sync | `sync_jobs` with `status = 'completed'` |
| 6 | Invite team members | `organization_invitations` has rows |

**Agent Registration Flow:**

```mermaid
sequenceDiagram
    participant Agent as Agent
    participant A as Dashboard API
    participant DB as Database
    participant M as Mail Provider

    Agent->>A: POST /api/agent/register
    Note right of Agent: enrollmentKey, hostname,<br/>os, architecture, agentVersion
    A->>DB: Lookup enrollment key by prefix
    A->>A: Verify key hash (argon2)
    A->>A: Check expiration
    A->>DB: UPSERT machines (ON CONFLICT updates)
    A->>DB: Update key last_used_at
    A->>M: Send agent-connected email to owner
    A->>A: Generate agent token (90-day)
    A-->>Agent: 201 { machineId, agentToken, syncInterval }
```

**Enrollment Key Format:**
- Prefix: `ai_live_` + 8 hex chars (e.g., `ai_live_a1b2c3d4`)
- Full key: prefix + 48 hex chars
- Stored as argon2 hash in database
- Expiration: configurable (default: no expiry)

---

## Stage 5: Activation

**Goal:** See first data in dashboard

**Data Flow:**

```mermaid
graph LR
    A[Agent] -->|Heartbeat every 5min| B[Dashboard API]
    A -->|Sync sessions| C[Ingestion API]
    C -->|Store events| D[(PostgreSQL)]
    D -->|Aggregate daily| E[Analytics Engine]
    E -->|Query| F[Dashboard]
```

**Dashboard Metrics Available:**
- Total sessions, users, tokens, cost
- Provider breakdown (OpenAI, Anthropic, etc.)
- Model usage analytics
- User-level usage
- Project-level usage
- Trend charts (daily/weekly/monthly)

**Period Options:** `24h`, `7d`, `30d`, `90d`, `1y`

---

## Stage 6: Adoption

**Goal:** Regular usage and team expansion

**Key Activities:**
- Daily dashboard review
- Inviting additional team members
- Adding more machines/agents
- Exploring analytics features
- Setting up integrations

**Team Management:**
- Roles: `owner`, `admin`, `member`
- Teams for grouping users
- Invitations with 7-day expiry

---

## Stage 7: Growth

**Goal:** Scale across organization

**Expansion Indicators:**
- Multiple machines registered
- Multiple teams created
- Advanced analytics usage
- API integrations
- High daily active usage

**Scaling Considerations:**
- Enrollment key management (rotation, multiple keys)
- Agent version management across machines
- Data retention policies
- Cost optimization through analytics

---

## Key Interactions

### Password Reset Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Dashboard API
    participant DB as Database
    participant M as Mail Provider

    U->>F: Click "Forgot Password"
    F->>A: POST /api/auth/forgot-password
    A->>DB: Look up user by email
    A->>DB: Delete existing reset tokens
    A->>A: Generate 32-byte token, hash with SHA-256
    A->>DB: Store hashed token (1-hour expiry)
    A->>M: Send password reset email
    A-->>F: 200 { success: true }

    U->>F: Clicks reset link in email
    F->>A: POST /api/auth/reset-password
    Note right of F: token + newPassword
    A->>DB: Look up hashed token
    A->>A: Check expiration
    A->>A: Validate password >= 8 chars
    A->>A: Hash new password (argon2)
    A->>DB: Update user password
    A->>DB: Mark token as used
    A->>DB: Invalidate all refresh tokens
    A-->>F: 200 { success: true }
    F-->>U: Redirect to login
```

### Invitation Accept Flow

```mermaid
sequenceDiagram
    participant U as Invited User
    participant F as Frontend
    participant A as Dashboard API
    participant DB as Database

    U->>F: Clicks invitation link
    F->>A: POST /api/invitations/accept
    Note right of F: invitation token
    A->>DB: Look up invitation by token
    A->>A: Check not already accepted
    A->>A: Check not expired (7 days)
    A->>A: Generate temporary password hash
    A->>DB: Create user (invited role)
    A->>DB: Add to General team
    A->>DB: Mark invitation accepted
    A->>A: Generate JWT
    A-->>F: 200 { token, user }
    F->>F: Store token
    F-->>U: Logged into organization
```

---

## Lifecycle Metrics

| Stage | Key Metric | Target |
|-------|-----------|--------|
| Visitor | CTA click rate | > 5% |
| Signup | Registration completion | > 80% of started |
| Verification | Email verification rate | > 70% |
| Onboarding | Wizard completion | > 60% |
| Activation | First data in dashboard | Within 24 hours |
| Adoption | Weekly active users | > 50% of registered |
| Growth | Team size increase | > 2 members avg |
