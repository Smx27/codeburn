# Getting Started

Complete onboarding guide from signup to viewing your first dashboard.

## Overview

AIInsight helps teams track AI coding costs across multiple providers. This guide walks you through creating an account, connecting your first agent, and viewing your analytics dashboard.

## Prerequisites

- A supported AI coding tool (Claude Code, Cursor, Codex, etc.)
- Node.js 22+ (for agent installation)
- A valid email address

## Quick Start

```
Register → Generate API Key → aiinsight login → aiinsight sync → Dashboard
```

## Step 1: Create Account

1. Navigate to [app.aiinsight.dev/register](https://app.aiinsight.dev/register)
2. Enter your name, email, and password
3. Click **Create Account**

<!-- Screenshot: Registration form -->

Your organization is created automatically during registration.

## Step 2: Verify Email

1. Check your inbox for a verification email from `no-reply@aiinsight.dev`
2. Click the **Verify Email** link in the email
3. You'll be redirected to the dashboard

<!-- Screenshot: Verification email -->

> **Note:** The verification link expires after 24 hours. If expired, log in and request a new link from Settings.

## Step 3: Generate API Key

1. Navigate to **Settings → API Keys** in the dashboard
2. Click **Generate API Key**
3. Give your key a descriptive name (e.g., `laptop-work`, `desktop-home`)
4. Copy the key — you'll need it in the next step

<!-- Screenshot: API key generation -->

> **Security:** API keys grant access to your organization. Store them securely and never commit them to version control.

## Step 4: Install Agent

Install the AIInsight agent on your machine:

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

See [Install Agent](install-agent.md) for detailed instructions.

## Step 5: Connect Agent

1. Open your terminal
2. Run the login command and paste your API key when prompted:

```bash
aiinsight login
```

3. The agent connects to your organization automatically
4. Run `aiinsight sync` to start syncing

<!-- Screenshot: Terminal showing registration success -->

## Step 6: Historical Sync

After registration, the agent automatically:

1. Scans your local AI coding tool session files
2. Parses session data and token usage
3. Uploads historical data to AIInsight Cloud
4. Triggers analytics aggregation

This process may take several minutes depending on the amount of historical data. You can monitor progress in **Settings → Agents → Sync Status**.

## Step 7: Invite Team (Optional)

Share AIInsight with your team:

1. Navigate to **Settings → Team**
2. Click **Invite Member**
3. Enter their email address
4. Select a role (Admin or Member)
5. Click **Send Invitation**

See [Invite Team](invite-team.md) for the full invitation workflow.

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

- [Install Agent](install-agent.md) — Platform-specific install details
- [CLI Reference](../cli/command-reference.md) — All CLI commands
- [Architecture](../architecture/overview.md) — System design
- [FAQ](faq.md) — Common questions
- [Troubleshooting](troubleshooting.md) — Common issues and solutions

## Self-Hosted Deployment

If you prefer to run AIInsight on your own infrastructure, see the [Deployment](../operations/deployment.md) guide.
