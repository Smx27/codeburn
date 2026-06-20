# Known Limitations

Current limitations of AIInsight.

## Overview

AIInsight is in active development. This document describes known limitations and planned improvements.

## CLI Limitations

### Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| macOS (arm64) | ✅ Full support | Primary platform |
| macOS (x64) | ✅ Full support | Primary platform |
| Linux (x64) | ✅ Full support | Primary platform |
| Linux (arm64) | ✅ Full support | Primary platform |
| Windows (x64) | ⚠️ Partial support | Some providers not detected |

### Provider Support

| Provider | Status | Notes |
|----------|--------|-------|
| Claude | ✅ Full support | All features |
| Codex | ✅ Full support | All features |
| Cursor | ⚠️ Partial support | Requires native module |
| Gemini | ✅ Full support | All features |
| Warp | ⚠️ CLI only | No cloud sync |
| OpenCode | ⚠️ CLI only | No cloud sync |
| Other providers | ⚠️ Varies | See provider docs |

### Performance

| Issue | Impact | Workaround |
|-------|--------|------------|
| Large session files | Slow parsing | Wait for completion |
| Many providers | Slower detection | Run `aiinsight providers` |
| Historical sync timeout | Incomplete sync | Run sync multiple times |

## Dashboard Limitations

### Features

| Feature | Status | Notes |
|---------|--------|-------|
| Dark mode | ❌ Not implemented | Light mode only |
| Mobile layout | ⚠️ Not optimized | Desktop recommended |
| Real-time updates | ❌ Not implemented | Manual refresh required |
| Export to PDF | ❌ Not implemented | CSV/JSON only |

### Performance

| Issue | Impact | Workaround |
|-------|--------|------------|
| Large date ranges | Slow loading | Use smaller date ranges |
| Many users | Slow tables | Use pagination |
| Complex charts | Slow rendering | Reduce data points |

## API Limitations

### Rate Limiting

| Route | Limit | Notes |
|-------|-------|-------|
| Auth routes | 100 req/min | Per IP |
| Ingestion routes | 1000 req/min | Per API key |
| Dashboard routes | 100 req/min | Per API key |

### Data

| Limitation | Notes |
|------------|-------|
| No prompt storage | By design for privacy |
| No real-time streaming | Batch uploads only |
| No webhook support | Planned for future |

## Sync Limitations

### Data Scope

| Data | Synced | Notes |
|------|--------|-------|
| Session metadata | ✅ | Session ID, provider, timestamps |
| Token counts | ✅ | Input, output, cache |
| Cost estimates | ✅ | Calculated from pricing |
| Model names | ✅ | Which model was used |
| Project names | ✅ | Directory name |
| Prompts | ❌ | By design |
| Code | ❌ | By design |
| Responses | ❌ | By design |

### Timing

| Limitation | Notes |
|------------|-------|
| No real-time sync | Runs on interval |
| Historical sync timeout | May need multiple runs |
| Aggregation delay | Hourly for yesterday's data |

## Organization Limitations

| Limitation | Notes |
|------------|-------|
| Single org per user | Multi-org planned |
| No org transfer | Manual process |
| No org merging | Not supported |

## Provider Limitations

### Detection

| Issue | Notes |
|-------|-------|
| Non-standard install paths | May not detect |
| Multiple installations | Uses first found |
| Version changes | May break detection |

### Parsing

| Issue | Notes |
|-------|-------|
| Format changes | May break parsing |
| Large files | Slow parsing |
| Malformed data | Graceful degradation |

## Security Limitations

| Limitation | Notes |
|------------|-------|
| No 2FA | Planned for future |
| No SSO | Not implemented |
| No audit logs | Planned for future |

## Workarounds

### Common Workarounds

| Issue | Workaround |
|-------|------------|
| Provider not detected | Run `aiinsight providers` |
| Sync timeout | Run sync with `--force` |
| Dashboard slow | Reduce date range |
| Email not received | Check spam, resend |

## Planned Improvements

See [Roadmap](../roadmap.md) for planned features and improvements.

## Reporting New Limitations

If you encounter a limitation not listed here:

1. Check [GitHub Issues](https://github.com/getagentseal/codeburn/issues) for existing reports
2. Create a new issue with label `limitation`
3. Include:
   - Description of limitation
   - Impact on your workflow
   - Any workarounds you've found

## Related Documentation

- [Expected Behavior](expected-behavior.md) — What to expect
- [FAQ](../getting-started/faq.md) — Common questions
- [Roadmap](../roadmap.md) — Planned features
