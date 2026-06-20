# Organization Onboarding

Set up and configure your AiInsight organization for team collaboration.

## Creating an Organization

Your organization is created automatically when you register a new account. The registration process requires:

```json
{
  "email": "you@company.com",
  "password": "securepassword",
  "name": "Your Name",
  "organizationName": "Acme Corp"
}
```

The first user becomes the **Owner** of the organization.

## Organization Settings

Navigate to **Settings → Organization** to configure your organization.

### General Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Organization Name | Display name for your org | Set during registration |
| Timezone | Used for daily/weekly aggregation boundaries | UTC |
| Currency | Default currency for cost display | USD |
| Data Retention | How long to keep raw session data | 90 days |

### Updating Settings

```bash
curl -X PATCH http://localhost:3002/api/v1/organizations/current \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "timezone": "America/New_York",
    "currency": "USD",
    "retentionDays": 90
  }'
```

### Supported Currencies

AiInsight supports 162 [ISO 4217 currencies](https://en.wikipedia.org/wiki/ISO_4217#List_of_ISO_4217_currency_codes). Exchange rates are fetched from the European Central Bank and cached for 24 hours.

## Managing Teams

Teams help organize members by project, department, or function.

### Creating a Team

**Via Dashboard:**
1. Navigate to **Settings → Teams**
2. Click **Create Team**
3. Enter team name and optional description
4. Click **Create**

**Via API:**

```bash
curl -X POST http://localhost:3002/api/v1/teams \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Platform Team",
    "description": "Infrastructure and platform engineering"
  }'
```

### Adding Members to Teams

```bash
curl -X POST http://localhost:3002/api/v1/teams/{teamId}/members \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id-here"
  }'
```

### Default Teams

The following teams are created during development seeding (not in production):

| Team | Purpose |
|------|---------|
| Platform Team | Infrastructure engineering |
| AI Team | AI/ML development |
| Security Team | Security engineering |

## Role-Based Access Control

AiInsight uses a role-based access system with three levels.

### Roles

| Role | Description | Dashboard | Settings | API Keys | Manage Members |
|------|-------------|-----------|----------|----------|----------------|
| **Owner** | Full access, billing | ✅ | ✅ | ✅ | ✅ |
| **Admin** | Organization management | ✅ | ✅ | ✅ | ✅ |
| **Member** | View dashboard only | ✅ | ❌ | ❌ | ❌ |

### Permission Details

| Permission | Owner | Admin | Member |
|------------|-------|-------|--------|
| View dashboard | ✅ | ✅ | ✅ |
| View analytics | ✅ | ✅ | ✅ |
| Update org settings | ✅ | ✅ | ❌ |
| Create/delete teams | ✅ | ✅ | ❌ |
| Add/remove team members | ✅ | ✅ | ❌ |
| Send invitations | ✅ | ✅ | ❌ |
| Revoke invitations | ✅ | ✅ | ❌ |
| Generate API keys | ✅ | ✅ | ❌ |
| Generate enrollment keys | ✅ | ✅ | ❌ |
| Delete organization | ✅ | ❌ | ❌ |

### Changing Roles

```bash
curl -X PATCH http://localhost:3002/api/v1/organizations/current/members/{userId} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin"
  }'
```

## API Key Management

API keys allow programmatic access to AiInsight APIs for machine-to-machine integration.

### Creating API Keys

**Via Dashboard:**
1. Navigate to **Settings → API Keys**
2. Click **Generate API Key**
3. Enter a descriptive name
4. Copy the key (shown only once)

**Via API:**

```bash
curl -X POST http://localhost:3002/api/v1/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CI/CD Pipeline"
  }'
```

### Using API Keys

API keys use the `Bearer` authentication scheme:

```bash
# Using Authorization header
curl http://localhost:3002/api/v1/dashboard/overview \
  -H "Authorization: Bearer cb_your_api_key_here"

# Or using X-API-Key header
curl http://localhost:3002/api/v1/dashboard/overview \
  -H "X-API-Key cb_your_api_key_here"
```

### API Key Security

- Keys are prefixed with `cb_` or `aisk_` for identification
- Keys are shown only once at creation — store them securely
- Keys can be revoked at any time from the dashboard or API
- Use separate keys for different environments (dev, staging, production)

### Revoking API Keys

```bash
curl -X DELETE http://localhost:3002/api/v1/api-keys/{keyId} \
  -H "Authorization: Bearer $TOKEN"
```

## Enrollment Keys

Enrollment keys allow agents to register with your organization and sync data.

### Creating Enrollment Keys

```bash
curl -X POST http://localhost:3002/api/v1/enrollment-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "laptop-work"
  }'
```

### Best Practices

- Use descriptive names for keys (e.g., `laptop-work`, `desktop-home`)
- Create separate keys per machine or team
- Rotate keys periodically for security
- Revoke keys for decommissioned machines

See [Getting Started](getting-started.md#step-3-generate-enrollment-key) for the enrollment workflow.

## Next Steps

- [Invitations](invitations.md) — Invite team members
- [Agent Installation](agent-installation.md) — Install the agent on team machines
- [Email Templates](email-templates.md) — Customize notification emails
- [Troubleshooting](troubleshooting.md) — Common issues and solutions
