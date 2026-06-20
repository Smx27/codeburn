# Email Notifications

AIInsight sends transactional emails for key events. All emails use the indigo/violet gradient design system.

---

## Email Templates

### Welcome Email

| Field | Value |
|-------|-------|
| **Trigger** | User registration (account creation) |
| **Subject** | `Welcome to AIInsight` |
| **Recipient** | Newly registered user |
| **Sent** | Immediately after registration |

**Contents:**
- Personalized greeting with user name
- Organization name confirmation
- Getting started steps:
  1. Install the agent on your machines
  2. Connect your AI providers (OpenAI, Anthropic, etc.)
  3. View your analytics dashboard in real-time
- **Open Dashboard** button linking to the dashboard URL

**Failure behavior:** Registration succeeds even if the welcome email fails to send.

---

### Verification Email

| Field | Value |
|-------|-------|
| **Trigger** | User registration |
| **Subject** | `Verify your email - AIInsight` |
| **Recipient** | Newly registered user |
| **Sent** | Immediately after registration |

**Contents:**
- Personalized greeting
- Call to verify email address to activate account
- **Verify Email Address** button with verification URL
- Expiration notice (24 hours)
- Security notice: "If you didn't create an account, you can safely ignore this email"
- Support contact: support@aiinsight.dev

**Token format:** 32-byte random hex string stored in `email_verifications` table

**Failure behavior:** Registration succeeds even if verification email fails. Users can request a new verification email via the **Resend Verification** endpoint.

---

### Invitation Email

| Field | Value |
|-------|-------|
| **Trigger** | Admin creates an invitation |
| **Subject** | `You've been invited to join {organizationName} on AIInsight` |
| **Recipient** | Invited email address |
| **Sent** | Immediately after invitation creation |

**Contents:**
- Greeting ("Hi there")
- Inviter name and organization name
- Assigned role displayed in a styled card
- **Accept Invitation** button with invitation URL
- Expiration notice (7 days)

**Token format:** 32-byte random hex string stored in `organization_invitations` table

**Failure behavior:** Invitation creation succeeds even if email fails. Admins can use **Resend Invitation** to retry.

---

### Password Reset Email

| Field | Value |
|-------|-------|
| **Trigger** | User requests password reset |
| **Subject** | `Reset your password - AIInsight` |
| **Recipient** | User who requested reset |
| **Sent** | Immediately after request |

**Contents:**
- Personalized greeting
- Explanation that a reset was requested
- **Reset Password** button with reset URL
- Expiration notice (1 hour)
- Security warning: "If you didn't request this reset, please ignore this email. Your password will remain unchanged"

**Token format:** 32-byte random hex, SHA-256 hashed before storage in `password_resets` table

**Failure behavior:** Returns success regardless of whether the user exists (prevents email enumeration).

---

### Agent Connected Email

| Field | Value |
|-------|-------|
| **Trigger** | First agent registration (machine connects) |
| **Subject** | `New agent connected - AIInsight` |
| **Recipient** | Organization owner (admin) |
| **Sent** | Immediately after agent registration |

**Contents:**
- Notification that a new agent connected
- Machine details in styled cards:
  - Machine hostname
  - Operating system
  - Organization name
  - Connected at timestamp
- Note that the agent is now online and will begin syncing

**Failure behavior:** Agent registration succeeds even if notification email fails.

---

### Sync Completed Email

| Field | Value |
|-------|-------|
| **Trigger** | First successful historical sync |
| **Subject** | `Historical sync complete - AIInsight` |
| **Recipient** | Organization owner (admin) |
| **Sent** | After sync completes successfully |

**Contents:**
- Personalized greeting
- Sync summary:
  - Sessions imported (large number display)
  - Providers detected (bulleted list)
- **View Dashboard** button

**Failure behavior:** Sync completion is recorded regardless of email delivery.

---

## Mail Configuration

### Resend (Default)

Set these environment variables:

```env
MAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
EMAIL_FROM=AIInsight <notifications@aiinsight.dev>
```

### SMTP

Set these environment variables:

```env
MAIL_PROVIDER=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_SECURE=true
EMAIL_FROM=AIInsight <notifications@aiinsight.dev>
```

### Dashboard URL

The base URL used in email links:

```env
APP_URL=https://app.aiinsight.dev
```

Note: `DASHBOARD_URL` and `FRONTEND_URL` are also supported for backward compatibility, but `APP_URL` is preferred.

---

## Email Delivery Architecture

```
Service Layer                    Mail Provider
─────────────                    ─────────────
dashboard.service.ts             ┌─────────────┐
  ├─ register()       ─────────> │  Welcome     │
  │                    ─────────> │  VerifyEmail │
  ├─ createInvitation() ────────> │  Invite      │
  ├─ generatePasswordReset() ───> │  PasswordReset│
  ├─ registerAgent()   ─────────> │  AgentConnected│
  └─ syncCompleted()   ─────────> │  SyncCompleted│
                                  └─────────────┘
```

All emails are sent asynchronously within try/catch blocks. Email failures are logged but never block the primary operation.

---

## Template Design

All templates share:
- **Background:** Dark slate (`#0f172a`)
- **Card:** Slightly lighter (`#1e293b`) with 12px border radius
- **Header:** Indigo-to-violet gradient (`#6366f1` to `#8b5cf6`)
- **Primary button:** Indigo (`#6366f1`) with white text
- **Body text:** Light slate (`#cbd5e1`)
- **Accent text:** White (`#ffffff`) for emphasis
- **Warning text:** Amber (`#f59e0b`)
- **Footer:** Muted slate (`#64748b`)

Each template provides both HTML and plain text versions for email client compatibility.
