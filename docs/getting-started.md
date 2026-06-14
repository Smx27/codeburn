# Getting Started with AiInsight

A step-by-step guide from signup to viewing your first dashboard.

<!-- Screenshot: Registration page -->

## Overview

AiInsight Cloud helps teams track AI coding costs across multiple providers. This guide walks you through creating an account, connecting your first agent, and viewing your analytics dashboard.

## Prerequisites

- A supported AI coding tool (Claude Code, Cursor, Codex, etc.)
- Node.js 20+ (for agent installation)
- A valid email address

## Step 1: Create Account

1. Navigate to [app.aiinsight.dev/register](https://app.aiinsight.dev/register)
2. Enter your name, email, and password
3. Click **Create Account**

<!-- Screenshot: Registration form -->

Your organization is created automatically during registration. See [Organization Onboarding](organization-onboarding.md) for configuration details.

## Step 2: Verify Email

1. Check your inbox for a verification email from `no-reply@aiinsight.dev`
2. Click the **Verify Email** link in the email
3. You'll be redirected to the dashboard

<!-- Screenshot: Verification email -->

> **Note:** The verification link expires after 24 hours. If expired, log in and request a new link from Settings.

## Step 3: Generate Enrollment Key

Enrollment keys allow agents to register and sync data to your organization.

1. Navigate to **Settings → Agents** in the dashboard
2. Click **Generate Enrollment Key**
3. Give your key a descriptive name (e.g., `laptop-work`, `desktop-home`)
4. Copy the key — you'll need it in the next step

<!-- Screenshot: Enrollment key generation -->

> **Security:** Enrollment keys grant access to your organization. Store them securely and never commit them to version control.

See [Agent Installation](agent-installation.md) for platform-specific installation details.

## Step 4: Install Agent

Install the AiInsight agent on your machine:

**macOS:**
```bash
brew install aiinsight/tap/aiinsight
```

**Linux:**
```bash
curl -fsSL https://get.aiinsight.dev/install.sh | bash
```

**Windows:**
```bash
winget install AIInsight.CLI
```

Verify the installation:

```bash
aiinsight --version
```

See [Agent Installation](agent-installation.md) for detailed instructions and troubleshooting.

## Step 5: Register Agent

1. Open your terminal
2. Run the registration command with your enrollment key:

```bash
aiinsight register --key ai_live_xxxxx_your_key_here
```

3. Confirm the organization name when prompted
4. The agent will start syncing automatically

<!-- Screenshot: Terminal showing registration success -->

## Step 6: Historical Sync

After registration, the agent automatically:

1. Scans your local AI coding tool session files
2. Parses session data and token usage
3. Uploads historical data to AiInsight Cloud
4. Triggers analytics aggregation

This process may take several minutes depending on the amount of historical data. You can monitor progress in **Settings → Agents → Sync Status**.

## Step 7: Invite Team (Optional)

Share AiInsight with your team:

1. Navigate to **Settings → Team**
2. Click **Invite Member**
3. Enter their email address
4. Select a role (Admin or Member)
5. Click **Send Invitation**

See [Invitations](invitations.md) for the full invitation workflow.

## Step 8: View Dashboard

Navigate to the **Dashboard** to see your analytics:

| Section | What You'll See |
|---------|-----------------|
| Overview | Total cost, API calls, sessions, cache hit rate |
| Providers | Per-provider breakdown (Claude, Codex, Cursor, etc.) |
| Users | Team leaderboard and activity |
| Projects | Cost by project |
| Models | Model distribution and pricing |
| Trends | Usage over time |

<!-- Screenshot: Dashboard overview -->

## Next Steps

- [Architecture](architecture.md) — Understand the system design
- [Agent Installation](agent-installation.md) — Platform-specific install details
- [Organization Onboarding](organization-onboarding.md) — Configure your org settings
- [Troubleshooting](troubleshooting.md) — Common issues and solutions

## API Reference

For programmatic access, see the [Developer Setup](dev-setup.md) guide which includes API endpoint documentation.

## Self-Hosted Deployment

If you prefer to run AiInsight on your own infrastructure, see the [Self-Hosted Deployment](architecture.md#self-hosted-deployment-docker) section in the Architecture doc.
