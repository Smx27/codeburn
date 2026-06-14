# Agent Installation Guide

This guide covers installing, configuring, and managing the AIInsight agent on all supported platforms.

## Overview

The AIInsight agent is a CLI tool that:
- Discovers session files from AI coding tools on your machine
- Parses token usage, costs, and tool calls
- Syncs the data to the cloud ingestion API
- Sends periodic heartbeats to report machine status

**What it collects:** Session metadata (token counts, model names, costs, tool usage)
**What it does NOT collect:** Prompts, code, file contents, or any source code

## Requirements

- **Node.js** 22+ (or standalone binary — no Node required)
- Internet connection for cloud sync
- Access to AI tool session directories (varies by OS)

## Supported Platforms

### macOS

**Install with Homebrew (recommended):**
```bash
brew install aiinsight/tap/aiinsight
```

**Install with curl:**
```bash
curl -fsSL https://get.aiinsight.dev/install.sh | bash
```

**Verify installation:**
```bash
aiinsight --version
```

**Permissions:**
- The agent needs read access to AI tool directories
- On macOS, you may need to grant Full Disk Access in System Settings → Privacy & Security → Full Disk Access
- Alternatively, the agent will prompt for folder access when needed

### Windows

**Install with WinGet:**
```powershell
winget install AIInsight.CLI
```

**Install with PowerShell:**
```powershell
irm https://get.aiinsight.dev/install.ps1 | iex
```

**Verify installation:**
```powershell
aiinsight --version
```

### Linux

**Install with curl:**
```bash
curl -fsSL https://get.aiinsight.dev/install.sh | bash
```

**Install with apt (Debian/Ubuntu):**
```bash
sudo apt install aiinsight
```

**Install with yum (RHEL/CentOS):**
```bash
sudo yum install aiinsight
```

**Verify installation:**
```bash
aiinsight --version
```

## Enrollment

### What Is an Enrollment Key?

An enrollment key is a one-time credential used to register a new agent with your organization. It's like a password for machines — it proves the agent is authorized to join your team.

### How to Get One

1. Log in to the AIInsight dashboard at [localhost:3000](http://localhost:3000)
2. Navigate to **Settings → Agents**
3. Click **Generate New Key**
4. Enter a name (e.g., "My MacBook Pro")
5. Optionally set an expiration date
6. Copy the key immediately — it won't be shown again

### Key Format

```
ai_live_<8-hex-chars>_<48-hex-chars>
```

Example:
```
ai_live_a1b2c3d4_e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3
```

## Agent Registration

### Registering a New Agent

```bash
aiinsight register --key <YOUR_ENROLLMENT_KEY>
```

Or interactively:
```bash
aiinsight register
# Prompts for enrollment key
```

### What Happens During Registration

1. The agent validates the enrollment key with the API
2. A machine record is created in the database
3. An agent token is issued for ongoing authentication
4. The token is stored at `~/.aiinsight/config.json`
5. Historical sync begins automatically
6. An email notification is sent to the organization owner

### Token Storage

After registration, the agent token is stored at:
```
~/.aiinsight/config.json
```

This file contains:
- Agent token (for API authentication)
- Machine ID
- Organization ID
- Sync interval

**Security:** Do not share this file. It grants access to your organization's data.

## Historical Sync

### Automatic on First Registration

When an agent is first registered, it automatically begins a historical sync:
1. Discovers all existing session files from supported providers
2. Parses token usage and costs
3. Uploads events to the ingestion API
4. The analytics engine aggregates the data

### Progress Indicators

During historical sync, the terminal shows:
```
Syncing Claude sessions... [12/47]
Syncing Codex sessions... [3/8]
Syncing Cursor sessions... [25/25]
Historical sync complete. 75 sessions, 1,234 events uploaded.
```

### What Gets Synced

- Session metadata (ID, provider, model, timestamps)
- Token counts (input, output, cache read, cache write)
- Cost calculations (using LiteLLM pricing)
- Tool usage (bash commands, file edits, web searches)
- Task categories (coding, debugging, planning, etc.)

### How Long It Takes

Depends on your history:
- **< 100 sessions:** Usually under 1 minute
- **100-1000 sessions:** 1-5 minutes
- **1000+ sessions:** 5-15 minutes

## Agent Status

### Checking Status

```bash
aiinsight status
```

Output:
```
Agent Status: Online
Machine: my-macbook-pro (macOS arm64)
Organization: Acme Corp
Last Sync: 2 minutes ago
Sessions: 156 (12 today)
```

### Understanding Status Output

| Field | Meaning |
|-------|---------|
| **Status** | Online/Offline |
| **Machine** | Hostname and platform |
| **Organization** | Your team name |
| **Last Sync** | Time since last data upload |
| **Sessions** | Total sessions synced (today's count) |

### Online/Offline Indicators

- **Online:** Agent is connected and sending heartbeats every 5 minutes
- **Offline:** Agent hasn't sent a heartbeat in > 5 minutes

## Updating Agents

### macOS (Homebrew)
```bash
brew upgrade aiinsight
```

### Windows (WinGet)
```powershell
winget upgrade AIInsight.CLI
```

### Linux (apt)
```bash
sudo apt upgrade aiinsight
```

### Standalone Binary
```bash
aiinsight update
```

## Uninstalling

### macOS (Homebrew)
```bash
brew uninstall aiinsight
```

### Windows (WinGet)
```powershell
winget uninstall AIInsight.CLI
```

### Linux (apt)
```bash
sudo apt remove aiinsight
```

### Cleanup

Remove local data:
```bash
rm -rf ~/.aiinsight/
```

## Troubleshooting

### Agent Won't Register

1. Verify the enrollment key is correct (copy-paste, no extra spaces)
2. Check that the key hasn't been revoked in **Settings → Agents**
3. Ensure you have internet connectivity
4. Check agent logs: `aiinsight logs`

### Agent Shows Offline

1. Check if the agent process is running: `aiinsight status`
2. Verify internet connectivity
3. Check if the machine has been reassigned a new token
4. Restart the agent: `aiinsight start`

### Historical Sync Stalled

1. Check internet connectivity
2. Verify the ingestion API is running: `curl localhost:3001/api/v1/health`
3. Restart the agent: `aiinsight restart`
4. Check logs for errors: `aiinsight logs`

### Permission Denied Errors

**macOS:** Grant Full Disk Access in System Settings → Privacy & Security
**Linux:** Ensure the user has read access to `~/.claude/`, `~/.codex/`, etc.
**Windows:** Run the agent as administrator if needed
