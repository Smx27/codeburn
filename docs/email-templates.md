# Email Templates

AiInsight sends transactional emails for account management, agent notifications, and sync updates. This guide documents available templates, customization options, and SMTP configuration.

## Available Templates

| Template | Trigger | Description |
|----------|---------|-------------|
| `welcome` | Account creation | Welcome message with getting started link |
| `verify` | Account creation / request | Email verification link |
| `password-reset` | Password reset request | Password reset link |
| `invitation` | Team invitation | Organization invitation link |
| `agent-connected` | Agent registration | New agent connected notification |
| `sync-completed` | Sync job completion | Historical sync finished notification |

## Template Variables

### Welcome Email

| Variable | Description | Example |
|----------|-------------|---------|
| `{{userName}}` | Recipient's name | `Priya` |
| `{{organizationName}}` | Organization name | `Acme Corp` |
| `{{dashboardUrl}}` | Link to dashboard | `https://app.aiinsight.dev/dashboard` |
| `{{supportEmail}}` | Support contact | `support@aiinsight.dev` |

### Verify Email

| Variable | Description | Example |
|----------|-------------|---------|
| `{{userName}}` | Recipient's name | `Priya` |
| `{{verificationUrl}}` | One-time verification link | `https://app.aiinsight.dev/verify?token=xxx` |
| `{{expiresIn}}` | Link expiration time | `24 hours` |

### Password Reset Email

| Variable | Description | Example |
|----------|-------------|---------|
| `{{userName}}` | Recipient's name | `Priya` |
| `{{resetUrl}}` | Password reset link | `https://app.aiinsight.dev/reset?token=xxx` |
| `{{expiresIn}}` | Link expiration time | `1 hour` |

### Invitation Email

| Variable | Description | Example |
|----------|-------------|---------|
| `{{inviterName}}` | Sender's name | `Alex` |
| `{{organizationName}}` | Organization name | `Acme Corp` |
| `{{role}}` | Invited role | `member` |
| `{{invitationUrl}}` | Acceptance link | `https://app.aiinsight.dev/invite?token=xxx` |
| `{{expiresIn}}` | Link expiration time | `7 days` |

### Agent Connected Email

| Variable | Description | Example |
|----------|-------------|---------|
| `{{userName}}` | Recipient's name | `Priya` |
| `{{agentHostname}}` | Machine hostname | `priya-macbook` |
| `{{agentOs}}` | Operating system | `macOS` |
| `{{agentVersion}}` | Agent version | `0.9.12` |
| `{{dashboardUrl}}` | Link to agent dashboard | `https://app.aiinsight.dev/settings/agents` |

### Sync Completed Email

| Variable | Description | Example |
|----------|-------------|---------|
| `{{userName}}` | Recipient's name | `Priya` |
| `{{agentHostname}}` | Machine hostname | `priya-macbook` |
| `{{sessionCount}}` | Sessions synced | `142` |
| `{{eventCount}}` | Events processed | `2,847` |
| `{{duration}}` | Sync duration | `3m 42s` |
| `{{dashboardUrl}}` | Link to dashboard | `https://app.aiinsight.dev/dashboard` |

## Customization Guide

### Modifying Templates

Templates are stored in `apps/dashboard-api/src/templates/email/` and use Handlebars syntax.

Example template structure:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #2563eb;
      color: white;
      text-decoration: none;
      border-radius: 6px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome to AiInsight, {{userName}}!</h1>
    <p>Your organization <strong>{{organizationName}}</strong> has been created.</p>
    <a href="{{dashboardUrl}}" class="button">View Dashboard</a>
    <p>If you have questions, contact us at {{supportEmail}}.</p>
  </div>
</body>
</html>
```

### Adding a New Template

1. Create a new `.html` file in `apps/dashboard-api/src/templates/email/`
2. Add template variables using `{{variableName}}` syntax
3. Register the template in `apps/dashboard-api/src/services/email.service.ts`
4. Add a trigger point in the relevant controller or service

### Testing Templates

Use the development seed to trigger template sends:

```bash
# Start the development environment
npm run dashboard-api:dev

# Trigger a test email (development mode logs to console)
curl -X POST http://localhost:3002/api/v1/test/send-email \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "template": "welcome",
    "to": "test@example.com",
    "variables": {
      "userName": "Test User",
      "organizationName": "Test Org",
      "dashboardUrl": "http://localhost:3000",
      "supportEmail": "support@aiinsight.dev"
    }
  }'
```

## SMTP Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server hostname | — |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | — |
| `SMTP_PASS` | SMTP password | — |
| `SMTP_FROM` | From address | `no-reply@aiinsight.dev` |
| `SMTP_SECURE` | Use TLS | `true` |

### Example: Gmail SMTP

```bash
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USER=your-email@gmail.com
export SMTP_PASS=your-app-password
export SMTP_FROM=aiinsight@yourcompany.com
```

> **Note:** Gmail requires an App Password for SMTP access. Generate one at https://myaccount.google.com/apppasswords.

### Example: Amazon SES

```bash
export SMTP_HOST=email-smtp.us-east-1.amazonaws.com
export SMTP_PORT=587
export SMTP_USER=your-ses-smtp-username
export SMTP_PASS=your-ses-smtp-password
export SMTP_FROM=noreply@yourdomain.com
```

### Example: SendGrid

```bash
export SMTP_HOST=smtp.sendgrid.net
export SMTP_PORT=587
export SMTP_USER=apikey
export SMTP_PASS=your-sendgrid-api-key
export SMTP_FROM=noreply@yourdomain.com
```

### Verifying SMTP Configuration

```bash
# Test SMTP connection
curl -X POST http://localhost:3002/api/v1/test/smtp-verify \
  -H "Authorization: Bearer $TOKEN"
```

## Resend Configuration

AiInsight can optionally use [Resend](https://resend.com/) as an email provider instead of SMTP.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `EMAIL_PROVIDER` | Email provider (`smtp` or `resend`) | `smtp` |
| `RESEND_API_KEY` | Resend API key | — |
| `RESEND_FROM` | From address (must be verified in Resend) | `no-reply@aiinsight.dev` |

### Setup

1. Create a Resend account at https://resend.com
2. Verify your domain
3. Generate an API key
4. Set environment variables:

```bash
export EMAIL_PROVIDER=resend
export RESEND_API_KEY=re_your_api_key_here
export RESEND_FROM=noreply@yourdomain.com
```

### Resend Benefits

- Higher deliverability rates
- Built-in analytics and open tracking
- No SMTP server management
- Free tier: 100 emails/day, 3,000/month

## Development Mode

In development (`NODE_ENV=development`), emails are logged to the console instead of being sent. This allows testing without SMTP configuration.

```bash
# Development mode logs email content
npm run dashboard-api:dev

# Output example:
# [Email] To: test@example.com
# [Email] Template: welcome
# [Email] Subject: Welcome to AiInsight
# [Email] Body: <html>...</html>
```

## Related Documentation

- [Organization Onboarding](organization-onboarding.md) — Org setup and team management
- [Troubleshooting](troubleshooting.md) — Common issues including email delivery
- [Architecture](architecture.md) — System overview including email services
