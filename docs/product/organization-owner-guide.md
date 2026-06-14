# Organization Owner Guide

This guide covers everything organization owners need to manage teams, invitations, enrollment keys, and analytics in AIInsight.

## Creating an Organization

Organizations are created automatically when the first user registers. The registration flow:

1. User registers with email, password, and organization name
2. Organization is created with default settings
3. A default "General" team is created
4. The registering user is assigned the **Owner** role

### Updating Organization Settings

Navigate to **Settings** to update:
- **Organization Name** — Display name for your team
- **Timezone** — Used for daily aggregation boundaries
- **Currency** — Display currency for cost reports (USD, EUR, GBP, etc.)

## Managing Teams

Teams let you group users for access control and reporting.

### Creating a New Team

1. Go to **Settings → Teams**
2. Click **Create Team**
3. Enter a name and optional description
4. Click **Create**

### Team Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Manage teams, invite users, generate keys, view all analytics |
| **Member** | View analytics, manage own agents |

### Adding Members to a Team

1. Go to **Settings → Teams**
2. Select the team
3. Click **Add Member**
4. Select a user from the dropdown
5. Choose a role (Admin or Member)
6. Click **Add**

### Removing Members

1. Select the team
2. Find the member
3. Click **Remove**

## Inviting Users

### Step-by-Step Invitation Process

1. Go to **Settings → Members** or use the onboarding wizard
2. Enter the invitee's email address
3. Select a role:
   - **Admin** — Full management access
   - **Member** — View-only analytics access
4. Click **Send Invitation**

The invitee receives an email with a link to join your organization.

### Invitation Details

- **Expiration:** Invitations expire after 7 days
- **Status:** Pending invitations show a "Pending" badge
- **Resend:** Click **Resend** to extend the expiration by 7 days
- **Revoke:** Click **Revoke** to cancel an unaccepted invitation

### Accepting Invitations

When someone accepts an invitation:
1. They click the link in the invitation email
2. If they don't have an account, they're prompted to create one
3. Their account is automatically added to your organization
4. They're added to the default "General" team
5. They receive a JWT token and can access the dashboard

### Bulk Invitations

Currently, invitations are sent one at a time. For bulk invitations, contact support@aiinsight.dev.

## Managing Enrollment Keys

Enrollment keys authenticate agents when they register with your organization.

### Creating a Key

1. Go to **Settings → Agents**
2. Click **Generate New Key**
3. Enter a descriptive name:
   - Use format: `<environment>-<machine-type>` (e.g., `prod-web-server`, `dev-macbook-pro`)
   - Or: `<team>-<machine>` (e.g., `platform-aws-1`, `frontend-mbp`)
4. Optionally set an expiration date
5. Click **Create**

### Key Format

Enrollment keys follow the format: `ai_live_<hex>_<hex>`

Example: `ai_live_a1b2c3d4_e5f6g7h8i9j0k1l2m3n4o5p6`

**Important:** The full key is only shown once. Copy it immediately after creation.

### Key Rotation Policy

- Rotate keys quarterly or when a team member leaves
- Rotating a key generates a new key and revokes the old one
- Agents using the revoked key will lose connectivity

### Revoking a Key

1. Go to **Settings → Agents**
2. Find the key
3. Click **Revoke** (trash icon)
4. Confirm the revocation

Agents using a revoked key will stop syncing data immediately.

### Expiration Dates

- Optional per key
- Expired keys are automatically rejected
- Set expiration for temporary access (e.g., contractor machines)

## Viewing Analytics

### Dashboard Overview

The overview page shows:
- **Total Cost** — Sum of all AI usage costs for the period
- **Total Calls** — Number of API calls made
- **Total Sessions** — Number of unique AI sessions
- **Cache Hit Rate** — Percentage of input tokens served from cache

### Provider Breakdown

See costs and usage broken down by AI provider:
- Claude (Anthropic)
- Codex (OpenAI)
- Cursor
- Gemini (Google)
- GitHub Copilot
- And 25+ more

### User Activity

Track which team members are using AI tools:
- Cost per user
- Sessions per user
- Activity heatmap

### Project Usage

See which projects consume the most AI resources:
- Cost per project
- Session count per project
- Model distribution per project

### Cost Trends

Historical charts showing:
- Daily cost trends
- Weekly/monthly aggregation
- Seasonal patterns

## Monitoring Agents

### Agent Status Indicators

| Status | Meaning |
|--------|---------|
| **Online** | Agent is connected and syncing (last heartbeat < 5 minutes ago) |
| **Offline** | Agent hasn't sent a heartbeat in > 5 minutes |

### Agent Dashboard

Navigate to **Settings → Agents** to see:
- Registered machines with hostname, OS, architecture
- Agent version
- Last seen timestamp
- Status indicator

### Offline Agent Troubleshooting

1. Check if the machine is powered on and connected to the internet
2. Verify the agent process is running: `aiinsight status`
3. Check agent logs for errors
4. Verify the enrollment key hasn't been revoked
5. Restart the agent: `aiinsight start`

## Best Practices

### Key Management
- Use meaningful key names that identify the machine and environment
- Rotate keys quarterly or when team members leave
- Set expiration dates for temporary access
- Revoke compromised keys immediately

### Role Assignment
- Assign **Owner** to 1-2 trusted administrators only
- Use **Admin** for team leads who need management access
- Use **Member** for most team members (view-only)
- Review roles quarterly

### Agent Health
- Monitor the agent dashboard regularly
- Set up alerts for offline agents (coming soon)
- Keep agents updated to the latest version
- Verify historical sync completes after registration

### Analytics Review
- Review weekly cost trends
- Identify unusual spending spikes
- Track model adoption across the team
- Use project breakdown for cost attribution

## Common Mistakes

| Mistake | Impact | Fix |
|---------|--------|-----|
| Sharing keys insecurely | Unauthorized access | Revoke and rotate the key |
| Not rotating expired keys | Agents lose connectivity | Generate new keys before expiry |
| Over-assigning admin roles | Security risk | Use principle of least privilege |
| Ignoring offline agents | Data gaps | Investigate and restart agents |
| Not reviewing analytics | Missed optimization opportunities | Set weekly review cadence |
