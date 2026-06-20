# Privacy Policy

Privacy policy for AIInsight.

**Last Updated:** June 20, 2026

## Introduction

AIInsight ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.

## Information We Collect

### Account Information

When you create an account, we collect:
- Name
- Email address
- Password (hashed)
- Organization name

### Usage Data

When you use AIInsight, we collect:
- Token counts (input, output, cache)
- Model names
- Timestamps
- Session metadata
- Cost estimates
- Machine information (hostname, OS, architecture)

### What We Never Collect

- **Prompts** — Your code and conversations
- **Code** — Your source files
- **Responses** — AI-generated content
- **File contents** — Your project files
- **Credentials** — Your API keys or passwords

## How We Use Your Information

### To Provide the Service

- Process your AI coding usage data
- Display analytics on your dashboard
- Sync data from your machines
- Send transactional emails

### To Improve the Service

- Analyze usage patterns (anonymized)
- Identify and fix bugs
- Develop new features
- Optimize performance

### To Communicate With You

- Send account-related emails
- Notify about service updates
- Respond to support requests
- Send marketing communications (with consent)

## Data Storage and Security

### Storage

- Data is stored in PostgreSQL databases
- Backups are performed daily
- Data is retained for 30 days (configurable)

### Security Measures

- Passwords hashed with Argon2
- API keys hashed with Argon2
- JWT tokens for authentication
- TLS encryption for data in transit
- Encryption at rest (when configured)

### Multi-Tenancy

- Data is isolated by organization
- No cross-organization data access
- Queries filtered by organization_id

## Data Sharing

### Third-Party Services

We share data with:
- **Email providers** (Resend, SMTP) — To send transactional emails
- **Analytics providers** — Anonymized usage data (with consent)

### Legal Requirements

We may disclose data if required by law or to protect our rights.

## Your Rights

### Access

You can access your data through:
- Dashboard settings
- API endpoints
- Data export

### Correction

You can update your information through:
- Dashboard settings
- Account settings

### Deletion

You can delete your data by:
- Deleting your organization
- Contacting support

### Portability

You can export your data in CSV or JSON format.

## Data Processing

### Self-Hosted

When you self-host AIInsight:
- Data stays on your infrastructure
- We have no access to your data
- You control all data processing

### Cloud

When you use AIInsight Cloud:
- Data is processed in our infrastructure
- We implement security measures
- You retain ownership of your data

## Children's Privacy

AIInsight is not intended for children under 13. We do not knowingly collect data from children.

## Changes to This Policy

We may update this policy from time to time. We will notify you of material changes via email.

## Contact Us

If you have questions about this Privacy Policy, please contact us at:
- Email: privacy@aiinsight.dev
- GitHub: https://github.com/priya/aiinsight/issues

## Related Documentation

- [Terms of Service](terms-of-service.md) — Service terms
- [Acceptable Use Policy](acceptable-use-policy.md) — Usage guidelines
- [Privacy & Security](../getting-started/privacy-and-security.md) — Security details
