# Getting Started

## Prerequisites

- Node.js 22+
- PostgreSQL 16+ (or Docker)
- An AI coding tool (Claude Code, Codex, Cursor, or Gemini CLI)

---

## Step 1: Sign Up

1. Open `http://localhost:3000/register`
2. Enter your email, password, and name
3. Click **Sign Up**

An organization is created automatically. You are the owner.

---

## Step 2: Verify Email

1. Check your email for a verification link
2. Click the link to verify your email
3. You'll be redirected to the dashboard

If you don't receive the email, go to **Settings** and click **Resend Verification**.

---

## Step 3: Create an API Key

1. Navigate to **Settings** in the sidebar
2. Click **Create API Key**
3. Enter a name (e.g., "My Sync Key")
4. Click **Create**
5. **Copy the key immediately** — it won't be shown again

---

## Step 4: Install the Agent

```bash
npm install -g aiinsight
```

---

## Step 5: Configure the Agent

```bash
aiinsight init
```

Follow the prompts:
1. Enter your API URL (default: `http://localhost:3001`)
2. Enter your API key (from Step 3)
3. Select your providers (Claude, Codex, Cursor, Gemini)

---

## Step 6: Run Sync

```bash
aiinsight sync
```

The sync engine will:
1. Discover JSONL log files from your AI coding tools
2. Parse and normalize the data
3. Upload batches to the Ingestion API
4. Update local sync state

---

## Step 7: View Dashboard

1. Open `http://localhost:3000/dashboard`
2. You'll see your usage data:
   - Total sessions, tokens, and cost
   - Breakdown by provider, model, project, and user
   - Trends over time

---

## Step 8: Invite Teammates

1. Navigate to **Settings** → **Team**
2. Click **Invite Member**
3. Enter their email and role
4. They'll receive an invitation email
5. They can create their account via the invitation link

---

## Step 9: Install on More Machines

Repeat Steps 4-6 on each developer machine:

```bash
npm install -g aiinsight
aiinsight init
aiinsight sync
```

Each machine gets its own identity and sync state.

---

## Troubleshooting

### Sync not working

1. Check that the Ingestion API is running: `curl http://localhost:3001/health`
2. Verify your API key: `aiinsight status`
3. Check logs: `aiinsight sync --verbose`

### No data in dashboard

1. Ensure sync completed successfully
2. Run backfill: `POST /api/v1/dashboard/backfill` (admin only)
3. Check that aggregation is running

### Can't log in

1. Verify email is verified
2. Check that the Dashboard API is running: `curl http://localhost:3002/health`
3. Reset password if needed: `/forgot-password`

---

## Next Steps

- [Read the FAQ](faq.md)
- [Understand the sync engine](../architecture/sync-engine.md)
- [Learn about providers](../architecture/provider-model.md)
- [Review the database schema](../architecture/database.md)
