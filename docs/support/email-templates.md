# Email Templates

Email templates used by AIInsight.

## Overview

AIInsight sends transactional emails for various user actions. This document describes the email templates and their configuration.

## Email Types

### Verification Email

**Trigger:** User registers new account

**Subject:** Verify your AIInsight account

**Content:**
```
Welcome to AIInsight!

Please verify your email address by clicking the link below:

[Verify Email Button]

This link expires in 24 hours.

If you didn't create an account, please ignore this email.

© AIInsight
```

### Invitation Email

**Trigger:** Admin invites team member

**Subject:** You've been invited to join {organization} on AIInsight

**Content:**
```
You've been invited to join {organization} on AIInsight!

AIInsight helps teams track AI coding costs across multiple providers.

[Accept Invitation Button]

This invitation expires in 7 days.

If you don't have an account, you'll be prompted to create one.

© AIInsight
```

### Password Reset Email

**Trigger:** User requests password reset

**Subject:** Reset your AIInsight password

**Content:**
```
You requested a password reset.

[Reset Password Button]

This link expires in 1 hour.

If you didn't request this, please ignore this email.

© AIInsight
```

### Password Changed Email

**Trigger:** User successfully changes password

**Subject:** Your AIInsight password has been changed

**Content:**
```
Your password has been successfully changed.

If you didn't make this change, please contact support immediately.

© AIInsight
```

## Configuration

### Resend

```bash
RESEND_API_KEY=re_...
```

### SMTP

```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
SMTP_FROM=noreply@aiinsight.dev
```

## Customization

### Organization Logo

Emails include the organization's logo if configured in **Settings → Organization**.

### Sender Name

Emails are sent from "AIInsight" by default. Customizable in **Settings → Organization**.

### Unsubscribe

Transactional emails (verification, invitation, password reset) are not unsubscribable as they're required for account security.

## Troubleshooting

### Email Not Received

1. Check spam/junk folder
2. Verify email address is correct
3. Check SMTP configuration
4. Verify sender domain is not blocked
5. Check email service status

### Email Delayed

1. Check email service status
2. Verify SMTP configuration
3. Check for rate limiting
4. Contact email service provider

## Related Documentation

- [Configuration](../architecture/configuration.md) — Environment variables
- [Troubleshooting](../getting-started/troubleshooting.md) — Common issues
- [Support Runbook](runbook.md) — Internal support reference
