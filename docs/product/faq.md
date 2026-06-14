# Frequently Asked Questions

## General

### What data does AIInsight collect?

AIInsight collects only metadata about AI coding sessions: timestamps, provider name, model name, token counts (input/output), estimated cost, project names, and machine identifiers. No prompts, source code, file contents, or personal data is collected.

See [Historical Sync Guide](./historical-sync.md) for details.

### Does AIInsight collect prompts?

No. AIInsight never collects prompts, conversation content, or any text from your interactions with AI models. Only usage metadata (token counts, model names, costs) is recorded.

### Is my data secure?

Yes. AIInsight uses:

- JWT-based authentication with refresh tokens
- Argon2 password hashing
- Role-based access control (Owner, Admin, Member)
- Encrypted enrollment keys for agent registration
- HTTPS for all API communication

Data is stored in PostgreSQL with proper access controls. See [Architecture](../architecture.md) for technical details.

### Can I self-host?

AIInsight is designed for self-hosting. The application consists of a Next.js dashboard, Express API, and PostgreSQL database. See [Dev Setup](../dev-setup.md) for installation instructions.

## Agents & Sync

### How often does sync run?

Incremental sync runs automatically every 60 minutes, processing the previous day's data. You can also trigger a full historical backfill on demand from the dashboard.

See [Historical Sync Guide](./historical-sync.md) for details.

### Can I disable providers?

Yes. You can disable specific providers in your organization settings. Disabled providers will not have their data processed during sync, but historical data is preserved.

### How do I remove a machine?

Navigate to **Settings > Agents**, find the machine, and click **Remove**. This revokes the agent's enrollment key and stops data collection from that machine. Historical data remains in the database.

### What if my agent goes offline?

The agent sends a heartbeat every 5 minutes. If no heartbeat is received for 15 minutes, the machine status changes to `offline` on the dashboard. When the agent reconnects, it resumes syncing from where it left off.

### Can I run multiple agents?

Yes. Running multiple agents on different machines is the standard setup. Each agent registers with its own machine ID. Data from all agents merges into the same organization's analytics.

## Organization & Teams

### How do invitations work?

An admin or owner sends an invitation by email. The invitee receives a link to accept. If they don't have an account, one is created automatically. Invitations expire after 7 days and can be resent.

See [Team Onboarding Guide](./team-onboarding.md) for the full process.

### Can I change user roles?

Yes. Owners and admins can change user roles from **Settings > Team**. Roles can be upgraded or downgraded at any time.

See [Role Management](./team-onboarding.md#role-management) for role details.

### How do I delete my organization?

Only the organization owner can delete the organization. Navigate to **Settings > Organization** and click **Delete Organization**. This action is irreversible and removes all data.

### What happens when a user leaves?

When a user is removed from the team:

- Their account is deactivated
- They can no longer access the dashboard
- Their historical data is preserved in analytics
- Their agent stops syncing (enrollment keys are revoked)
- Their cost and usage data remains in reports

## Analytics

### How is cost calculated?

AIInsight estimates costs using published provider pricing for input and output tokens. The formula is:

```
cost = (input_tokens * input_price) + (output_tokens * output_price)
```

Prices are based on standard published rates and may not reflect negotiated enterprise pricing.

### Why don't my numbers match my provider bill?

Several factors can cause differences:

- Negotiated enterprise pricing not reflected in standard rates
- Promotional credits or free tier usage
- Rounding differences in token counting
- Timing differences (sessions crossing midnight)
- Currency conversion

Use AIInsight costs as a directional estimate, not an exact billing figure.

### Can I export data?

Data export is available via the API. You can pull raw aggregation data for any time period. A CSV export feature is planned for a future release.

### How long is data retained?

By default, data is retained indefinitely. You can configure retention periods in **Settings > Organization**. Data older than the configured retention period is automatically cleaned up.

## Technical

### What database does AIInsight use?

AIInsight uses PostgreSQL. The database stores raw session events, precomputed aggregate tables, user accounts, organizations, and configuration. See [ADR-002](../adr/ADR-002-precomputed-aggregate-tables.md) for the aggregation design.

### Can I use a custom mail provider?

Yes. AIInsight supports pluggable mail providers. Configure your mail provider in the environment variables. Supported providers include SMTP, SendGrid, and Resend.

See [Email Templates](../email-templates.md) for template details.

### How do I update AIInsight?

Pull the latest code from the repository, install dependencies, and restart the services:

```bash
git pull origin main
npm install
npm run build
# Restart API and dashboard services
```

Run database migrations if any are included in the update.

### Where are configuration files stored?

- **Environment variables**: `.env` file in the project root
- **Organization settings**: Database (`organization_settings` table)
- **Dashboard configuration**: `apps/dashboard-web/src/lib/`
- **API configuration**: `apps/dashboard-api/src/`

See [Dev Setup](../dev-setup.md) for the full configuration reference.
