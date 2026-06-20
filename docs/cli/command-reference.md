# Command Reference

Complete reference for all AIInsight CLI commands.

## Global Options

| Option | Description |
|--------|-------------|
| `--verbose` | Print warnings to stderr on read failures and skipped files |
| `--timezone <zone>` | IANA timezone for date grouping (e.g., `Asia/Tokyo`, `America/New_York`) |
| `--help` | Show help information |
| `--version` | Show version and platform info |

## Commands

| Command | Description | Aliases |
|---------|-------------|---------|
| [`aiinsight report`](#report) | Interactive usage dashboard | `aiinsight` (default) |
| [`aiinsight today`](#today) | Today-only view | — |
| [`aiinsight month`](#month) | Month-only view | — |
| [`aiinsight export`](#export) | Export usage data to CSV or JSON | — |
| [`aiinsight status`](#status) | Compact status output | — |
| [`aiinsight optimize`](#optimize) | Run waste detectors | — |
| [`aiinsight compare`](#compare) | Compare two models side by side | — |
| [`aiinsight yield`](#yield) | Track sessions shipped vs reverted | — |
| [`aiinsight sync`](#sync) | Sync usage data to AIInsight Cloud | — |
| [`aiinsight login`](#login) | Connect to AIInsight Cloud | — |
| [`aiinsight logout`](#logout) | Disconnect from AIInsight Cloud | — |
| [`aiinsight config`](#config) | View or manage configuration | — |
| [`aiinsight providers`](#providers) | List detected AI coding providers | — |
| [`aiinsight doctor`](#doctor) | Run diagnostics | — |
| [`aiinsight menubar`](#menubar) | Download macOS menubar app | — |
| [`aiinsight currency`](#currency) | Set display currency | — |
| [`aiinsight model-alias`](#model-alias) | Map unknown model names | — |
| [`aiinsight plan`](#plan) | Configure subscription plan | — |
| [`aiinsight version`](#version) | Show version info | — |

---

## report

Interactive usage dashboard (default command).

```bash
aiinsight report [options]
```

### Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `-p, --period <period>` | string | `week` | Starting period: `today`, `week`, `30days`, `month`, `all` |
| `--day <date>` | string | — | Single day to review (YYYY-MM-DD, `today`, or `yesterday`) |
| `--from <date>` | string | — | Start date (YYYY-MM-DD) |
| `--to <date>` | string | — | End date (YYYY-MM-DD) |
| `--provider <provider>` | string | `all` | Filter by provider (e.g., `claude`, `gemini`, `cursor`) |
| `--format <format>` | string | `tui` | Output format: `tui`, `json` |
| `--project <name>` | string[] | — | Show only projects matching name (repeatable) |
| `--exclude <name>` | string[] | — | Exclude projects matching name (repeatable) |
| `--refresh <seconds>` | integer | `30` | Auto-refresh interval in seconds (0 to disable) |

### Examples

```bash
# Interactive dashboard for this week
aiinsight report

# JSON output for last 30 days
aiinsight report --period 30days --format json

# Filter by provider
aiinsight report --provider claude

# Single day view
aiinsight report --day 2026-06-20

# Custom date range
aiinsight report --from 2026-06-01 --to 2026-06-20
```

---

## today

Today-only view of the report.

```bash
aiinsight today [options]
```

### Options

Same as `report` with `--period today` preset.

### Example

```bash
aiinsight today
```

---

## month

Month-only view of the report.

```bash
aiinsight month [options]
```

### Options

Same as `report` with `--period month` preset.

### Example

```bash
aiinsight month
```

---

## export

Export usage data to CSV or JSON.

```bash
aiinsight export [options]
```

### Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--format <format>` | string | `csv` | Export format: `csv`, `json` |
| `-p, --period <period>` | string | `week` | Time period |
| `--provider <provider>` | string | `all` | Filter by provider |
| `--output <file>` | string | — | Output file path |

### Examples

```bash
# Export to CSV
aiinsight export --format csv

# Export to JSON
aiinsight export --format json --output usage.json

# Export last 30 days
aiinsight export --period 30days
```

---

## status

Compact text status output.

```bash
aiinsight status [options]
```

### Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--format <format>` | string | `terminal` | Output format: `terminal`, `menubar-json`, `json` |
| `--provider <provider>` | string | `all` | Filter by provider |
| `--period <period>` | string | `today` | Primary period for menubar-json |
| `--day <date>` | string | — | Single day for menubar-json |
| `--from <date>` | string | — | Start date for custom range |
| `--to <date>` | string | — | End date for custom range |
| `--days <dates>` | string | — | Comma-separated dates for multi-day selection |
| `--no-optimize` | flag | — | Skip optimize findings (menubar-json only) |

### Examples

```bash
# Terminal output
aiinsight status

# JSON output
aiinsight status --format json

# Menubar format
aiinsight status --format menubar-json

# Filter by provider
aiinsight status --provider claude
```

---

## optimize

Runs all waste detectors to identify cost optimization opportunities.

```bash
aiinsight optimize [options]
```

### Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `-p, --period <period>` | string | `week` | Time period to analyze |
| `--provider <provider>` | string | `all` | Filter by provider |
| `--format <format>` | string | `terminal` | Output format |

### Example

```bash
aiinsight optimize
```

---

## compare

Compares two models side by side.

```bash
aiinsight compare <model1> <model2> [options]
```

### Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `-p, --period <period>` | string | `week` | Time period |

### Example

```bash
aiinsight compare claude-sonnet-4-20250514 claude-opus-4-20250514
```

---

## yield

Tracks sessions shipped vs reverted (experimental).

```bash
aiinsight yield [options]
```

### Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `-p, --period <period>` | string | `week` | Time period |

### Example

```bash
aiinsight yield
```

---

## sync

Sync usage data to AIInsight Cloud.

```bash
aiinsight sync [options]
```

### Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--force` | flag | — | Force full historical sync |
| `--providers <list>` | string | `all` | Comma-separated list of providers to sync |
| `--continuous` | flag | — | Run continuous sync loop |

### Examples

```bash
# Standard sync
aiinsight sync

# Force full historical sync
aiinsight sync --force

# Sync only Claude and Codex
aiinsight sync --providers claude,codex

# Continuous sync mode
aiinsight sync --continuous
```

### Expected Output

```
  ▸ Scanning for AI coding sessions...
  ✓ Found 15 sessions across 3 providers
  ▸ Uploading batches...
  ✓ Sync complete: 15 sessions, 245 events uploaded
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Connection refused` | Cannot reach API | Check network and API URL |
| `Invalid API key` | Key revoked or invalid | Run `aiinsight login` again |
| `Rate limit exceeded` | Too many requests | Wait and retry |
| `No sessions found` | No data to sync | Check provider detection with `aiinsight providers` |

---

## login

Connect to AIInsight Cloud with API key.

```bash
aiinsight login [api-url]
```

### Arguments

| Argument | Description |
|----------|-------------|
| `api-url` | Optional API URL (default: `http://localhost:3001`) |

### Examples

```bash
# Login with default API
aiinsight login

# Login with custom API URL
aiinsight login https://api.aiinsight.dev
```

### Expected Output

```
  ✓ Connected to AIInsight Cloud

    Organization: My Team
    Machine ID:   mach_abc123
    API URL:      http://localhost:3001
    Sync Interval: 300 seconds

  Run aiinsight sync to start syncing.
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Connection timed out` | Network issue | Check network connectivity |
| `Invalid API key` | Key revoked or invalid | Generate new key in dashboard |
| `Organization not found` | Key belongs to deleted org | Create new organization |

---

## logout

Disconnect from AIInsight Cloud and clear sync data.

```bash
aiinsight logout [options]
```

### Options

| Flag | Description |
|------|-------------|
| `--force` | Skip confirmation prompt |

### Examples

```bash
# Interactive logout
aiinsight logout

# Force logout without confirmation
aiinsight logout --force
```

### Expected Output

```
  ✓ Disconnected from AIInsight Cloud

    Organization: My Team
    Status:       All sync data cleared
```

### What Gets Cleared

- Sync configuration
- Machine ID
- Sync state directory
- Upload queue directory

---

## config

View or manage configuration.

```bash
aiinsight config [action]
```

### Actions

| Action | Description |
|--------|-------------|
| (none) | Show current configuration |
| `edit` | Open config in default editor |
| `reset` | Clear sync configuration |

### Examples

```bash
# Show configuration
aiinsight config

# Open config in editor
aiinsight config edit

# Reset configuration
aiinsight config reset
```

### Expected Output

```
  AIInsight Configuration

  Organization       : My Team
  Organization ID    : org_abc123
  Machine ID         : mach_abc123
  API URL            : http://localhost:3001
  Sync Interval      : 300s (5 min)
  Sync Enabled       : Yes
  Config File        : ~/.config/aiinsight/config.json
```

---

## providers

List detected AI coding providers.

```bash
aiinsight providers
```

### Expected Output

```
  AIInsight Provider Discovery

  ✓ Claude        Detected ~/.claude
  ✓ Codex         Detected ~/.codex
  ✓ Cursor        Detected ~/.config/Cursor
  ✓ Gemini        Detected ~/.gemini
  ○ Warp          Not detected
  ○ OpenCode      Not detected
  ✓ Cline         Detected ~/.cline
  ✓ Roo Code      Detected ~/.roo
  ✓ Kilo Code     Detected ~/.kilocode
  ○ Copilot       Not detected
  ○ Devin         Not detected
  ○ Pi            Not detected
  ○ OpenClaw      Not detected
  ○ Qwen          Not detected
  ○ Kimi          Not detected

  7 provider(s) detected
```

---

## doctor

Run diagnostics to check configuration.

```bash
aiinsight doctor
```

### Expected Output

```
  AIInsight Doctor

  ✓ Node.js version: 22.13.0
  ✓ Config file exists
  ✓ API key configured
  ✓ Organization configured
  ✓ Provider directories accessible
  ✓ Network connectivity OK

  All checks passed!
```

---

## menubar

Download and install the macOS menubar app.

```bash
aiinsight menubar [options]
```

### Options

| Flag | Description |
|------|-------------|
| `--force` | Force reinstall |

### Example

```bash
aiinsight menubar
```

---

## currency

Set display currency.

```bash
aiinsight currency [code]
```

### Arguments

| Argument | Description |
|----------|-------------|
| `code` | ISO 4217 currency code (e.g., `USD`, `EUR`, `GBP`) |

### Example

```bash
# Set to USD
aiinsight currency USD

# Set to EUR
aiinsight currency EUR
```

---

## model-alias

Map unknown model names for pricing.

```bash
aiinsight model-alias <unknown> <known>
```

### Arguments

| Argument | Description |
|----------|-------------|
| `unknown` | Unknown model name |
| `known` | Known model name to map to |

### Example

```bash
# Map unknown model to known model
aiinsight model-alias my-custom-model claude-sonnet-4-20250514
```

---

## plan

Configure subscription plan for overage tracking.

```bash
aiinsight plan [options]
```

### Options

| Flag | Type | Description |
|------|------|-------------|
| `--provider <provider>` | string | Provider name (e.g., `anthropic`, `openai`) |
| `--budget <amount>` | number | Monthly budget in USD |
| `--reset-day <day>` | integer | Day of month for reset (1-28) |

### Example

```bash
# Set Anthropic plan
aiinsight plan --provider anthropic --budget 100 --reset-day 1
```

---

## version

Show version and platform info.

```bash
aiinsight version
```

### Expected Output

```
  AIInsight v1.0.0

  Node.js:    22.13.0
  Platform:   darwin
  Arch:       arm64
```

---

## Exit Codes

| Code | Description |
|------|-------------|
| `0` | Success |
| `1` | General error |
| `2` | Invalid arguments |
| `3` | Network error |
| `4` | Authentication error |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `AIINSIGHT_TZ` | Default timezone (overrides `--timezone`) |
| `AIINSIGHT_VERBOSE` | Enable verbose logging when set to `1` |
| `SYNC_INTERVAL` | Sync interval in seconds |
| `DATABASE_URL` | PostgreSQL connection string (for cloud services) |
| `JWT_SECRET` | JWT signing secret (for cloud services) |

## Related Documentation

- [Getting Started](../getting-started/getting-started.md) — Initial setup
- [Install Agent](../getting-started/install-agent.md) — Installation
- [FAQ](../getting-started/faq.md) — Common questions
- [Troubleshooting](../getting-started/troubleshooting.md) — Common issues
