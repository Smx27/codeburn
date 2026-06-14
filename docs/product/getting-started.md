# Getting Started with AIInsight

This guide walks you through going from zero to a working dashboard with AI usage data.

## What Is AIInsight?

AIInsight is an AI usage analytics platform for engineering teams. It tracks token usage, costs, and performance across 30+ AI coding tools.

**Key characteristics:**
- No proxy, no API keys needed — the agent reads session data directly from disk
- Self-hosted or cloud deployment
- Tracks 30+ providers including Claude Code, Codex, Cursor, Gemini CLI, and more
- Real-time cost attribution by provider, model, user, and project

## How AIInsight Works

```
Developer Machine              Cloud Infrastructure
+------------------+          +-------------------+
| AI Coding Tools  |          | Ingestion API     |
| (Claude, Codex,  |          | (receives events) |
|  Cursor, etc.)   |          +-------------------+
+------------------+                  |
        |                             v
        v                     +-------------------+
+------------------+          | Analytics Engine  |
| AIInsight Agent  | --------> | (aggregates data) |
| (CLI tool)       |          +-------------------+
+------------------+                  |
                                      v
                              +-------------------+
                              | Dashboard API     |
                              | (serves queries)  |
                              +-------------------+
                                      |
                                      v
                              +-------------------+
                              | Web Dashboard     |
                              | (Next.js 15)      |
                              +-------------------+
```

1. **CLI agent** runs on developer machines and discovers AI tool session files
2. **Sync Engine** parses sessions and uploads events to the cloud
3. **Analytics Engine** aggregates raw events into daily summaries (hourly runs)
4. **Dashboard** displays team-wide insights via pre-aggregated queries

## Supported Providers

| Provider | Type | Description |
|----------|------|-------------|
| Claude Code | CLI | Anthropic's coding assistant |
| Claude Desktop | Desktop | Anthropic's desktop app |
| Codex | CLI | OpenAI's coding agent |
| Cursor | IDE | AI-powered code editor |
| Cursor Agent | IDE | Cursor's background agent |
| Gemini CLI | CLI | Google's coding assistant |
| GitHub Copilot | Extension | GitHub's AI pair programmer |
| Cline | Extension | VS Code AI coding assistant |
| Roo Code | Extension | Cline-family VS Code extension |
| KiloCode | Extension | Cline-family VS Code extension |
| OpenCode | CLI | Open-source coding assistant |
| Warp | Terminal | AI-powered terminal |
| Devin | CLI | Cognition's AI software engineer |
| Goose | CLI | Block's AI agent |
| Forge | CLI | AI coding agent |
| Antigravity | CLI/IDE | Google's coding tools |
| Crush | CLI | AI coding assistant |
| Mistral Vibe | CLI | Mistral's coding assistant |
| Pi | CLI | AI coding assistant |
| OMP (Oh My Pi) | CLI | Pi-family assistant |
| Droid | CLI | AI coding assistant |
| Qwen | CLI | Alibaba's coding assistant |
| Kimi Code CLI | CLI | Moonshot's coding assistant |
| Kiro | IDE | AWS's AI IDE |
| IBM Bob | IDE | IBM's AI coding assistant |
| OpenClaw | CLI | AI coding agent |
| Codebuff | CLI | AI coding agent |
| Mux | CLI | Coder's AI assistant |
| Vercel AI Gateway | Gateway | Vercel's AI routing |

## Core Concepts

| Concept | Description |
|---------|-------------|
| **Organization** | Top-level entity representing your team or company |
| **Team** | Group of users within an organization (e.g., "Platform Team") |
| **User** | Individual with login credentials and a role |
| **Machine** | Physical or virtual machine running the AIInsight agent |
| **Agent** | CLI tool that syncs data from AI tools to the cloud |
| **Enrollment Key** | One-time key used to register a new agent |
| **Agent Token** | Ongoing authentication token issued after registration |
| **Historical Sync** | Automatic backfill of past session data on first registration |

## Quick Start

### Step 1: Sign Up

Visit [localhost:3000/register](http://localhost:3000/register) and create an account.

You'll need:
- Email address
- Password (minimum 8 characters)
- Organization name

### Step 2: Verify Your Email

Check your inbox for a verification email from AIInsight. Click the link to verify your account. If you don't receive it, check your spam folder or click "Resend" on the login page.

### Step 3: Create Your Organization

Your organization is created automatically during registration. You can update the name, timezone, and currency in **Settings**.

### Step 4: Generate an Enrollment Key

1. Go to **Settings → Agents**
2. Click **Generate New Key**
3. Enter a descriptive name (e.g., "My MacBook Pro")
4. Optionally set an expiration date
5. Copy and save the key — it won't be shown again

### Step 5: Install the Agent

**macOS:**
```bash
brew install aiinsight/tap/aiinsight
```

**Linux:**
```bash
curl -fsSL https://get.aiinsight.dev/install.sh | bash
```

**Windows:**
```powershell
winget install AIInsight.CLI
```

Verify installation:
```bash
aiinsight --version
```

### Step 6: Register Your Agent

Run the agent and paste your enrollment key when prompted:

```bash
aiinsight register --key <YOUR_ENROLLMENT_KEY>
```

The agent will:
1. Validate the enrollment key
2. Register your machine with the organization
3. Receive an agent token for ongoing authentication
4. Begin historical sync automatically

### Step 7: Wait for Historical Sync

The first sync backfills your past session data. Progress is shown in the terminal. Depending on your history, this may take a few minutes.

### Step 8: View Your Dashboard

Visit [localhost:3000/dashboard](http://localhost:3000/dashboard) to see your AI usage analytics. The dashboard includes:

- **Overview** — Total costs, calls, sessions, and cache hit rates
- **Providers** — Breakdown by AI provider (Claude, Codex, Cursor, etc.)
- **Models** — Usage and cost by model (Sonnet, GPT-4o, etc.)
- **Users** — Team member activity and costs
- **Projects** — Cost attribution by project
- **Trends** — Historical usage patterns

## Next Steps

- [Agent Installation](agent-installation.md) — Detailed platform-specific instructions
- [Organization Owner Guide](organization-owner-guide.md) — Managing teams and settings
- [Analytics Guide](analytics-guide.md) — Understanding your dashboard data
- [Team Onboarding](team-onboarding.md) — Rolling out to your team
