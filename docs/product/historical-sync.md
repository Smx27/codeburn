# Historical Sync Guide

## What Historical Sync Does

Historical sync backfills past AI coding session data from local files into the AIInsight database. It processes sessions from all supported providers (Claude, Codex, Cursor, Gemini, and more) and creates aggregated analytics from the raw event data.

The sync pipeline runs five aggregation passes per day:

1. **Daily Usage** - Total sessions, users, tokens, and cost per day
2. **Provider Usage** - Breakdown by provider (Claude, Codex, etc.)
3. **Model Usage** - Breakdown by specific model
4. **User Usage** - Per-user session counts, tokens, and cost
5. **Project Usage** - Per-project session counts, tokens, and cost

## What Data Is Collected

AIInsight collects only metadata about AI coding sessions. The following data **is** collected:

- Session metadata (start/end time, provider, model name)
- Token usage (input tokens, output tokens, cache read, cache write)
- Estimated cost in USD
- Project names (directory names, not file contents)
- Machine identifiers (hostname, OS, architecture)

The following data is **never** collected:

- Prompts or conversation content
- Source code or file contents
- Credentials, API keys, or secrets
- Personal files or documents

## How Long It Takes

Sync duration depends on data volume and the number of days to process:

| Data Volume | Estimated Time |
|-------------|----------------|
| < 1 month of data | 1-5 minutes |
| 1-6 months | 5-30 minutes |
| 6-12 months | 30-60 minutes |
| 12+ months | Up to 2 hours |

The system processes one day at a time and logs progress every 10 days.

## Progress Tracking

### Monitoring Sync Progress

During a backfill, the analytics engine logs progress every 10 days processed. Progress logs include:

- Organization ID
- Total days to process
- Days processed so far
- Current date being processed

### Sync Status Values

| Status | Description |
|--------|-------------|
| `running` | Sync is actively processing |
| `completed` | All days processed successfully |
| `failed` | An error occurred during processing |

### Sync Job Details

Each sync run is tracked as an `AggregationRun` record containing:

- **Operation type**: `historical_backfill` or `daily`
- **Start/completion timestamps**
- **Records processed**: Number of days successfully aggregated
- **Error messages**: If the run failed or had partial failures

Failed days are tracked individually. A sync that processes 180 out of 200 days with 20 failures will have `status: completed` with `failedDays: 20` in its result.

## Common Questions

### Can I run sync on multiple machines?

Yes. Data from multiple machines merges automatically. The system deduplicates sessions by organization, date, and provider. Running agents on multiple machines is expected and supported.

### What if sync fails?

Failed days are retried automatically on the next sync run. The system uses exponential backoff for transient errors. If a full run fails, the aggregation run is marked as `failed` and a new run can be triggered.

### Can I cancel sync?

Yes. You can cancel a running sync from the dashboard. Partial progress is preserved -- days already processed remain aggregated.

### How often does sync run?

- **Incremental sync**: Runs automatically every 60 minutes, processing the previous day's data
- **On-demand full backfill**: Triggered manually from the dashboard or API when you need to reprocess historical data

### What happens if my agent goes offline?

When the agent reconnects, it resumes syncing from where it left off. The agent sends a heartbeat every 5 minutes to indicate it is online. If no heartbeat is received for 15 minutes, the machine status changes to `offline`.

## Troubleshooting

### Sync stuck or not progressing

1. Check agent status on the dashboard -- the machine should show as `ONLINE`
2. Verify the agent is running: check the agent process on the machine
3. Restart the agent if it appears unresponsive
4. Check API server logs for errors during aggregation

### Missing data after sync

1. Verify the provider is configured and enabled in your organization settings
2. Check that the agent has access to the correct data directory
3. Look at aggregation run logs for any failed days
4. Re-run a full backfill for the affected date range

### Slow sync performance

1. Reduce batch size if processing very large datasets
2. Check database connection pool settings
3. Verify network connectivity between the API server and database
4. Consider running sync during off-peak hours for large datasets

### Data mismatch between providers

Provider data comes from local session files. If a provider's session format changes, the parser may need updating. Check the agent version and ensure you're running the latest release.
