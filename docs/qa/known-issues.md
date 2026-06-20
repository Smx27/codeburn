# Known Issues

Known issues and limitations in AIInsight.

## Current Version (1.0.0)

### CLI

| Issue | Severity | Workaround |
|-------|----------|------------|
| `aiinsight menubar` requires macOS | Low | Use CLI commands instead |
| `better-sqlite3` build fails on some systems | Medium | Install build tools: `xcode-select --install` (macOS) or `apt install build-essential python3` (Linux) |
| Large session files slow parsing | Low | Wait for parsing to complete |

### Dashboard

| Issue | Severity | Workaround |
|-------|----------|------------|
| Charts may not render with no data | Low | Add test data first |
| Dark mode not implemented | Low | Use light mode |
| Mobile layout not optimized | Low | Use desktop browser |

### API

| Issue | Severity | Workaround |
|-------|----------|------------|
| Rate limiting may block high-volume syncs | Low | Increase batch size |
| Email delivery may be delayed | Low | Check spam folder |

### Sync

| Issue | Severity | Workaround |
|-------|----------|------------|
| Some providers not detected on first run | Low | Run `aiinsight providers` to check |
| Historical sync may timeout for large datasets | Medium | Run sync multiple times |
| Cursor support requires native compilation | Medium | Install build tools |

## Provider-Specific Issues

### Claude

| Issue | Severity | Workaround |
|-------|----------|------------|
| Session files may be locked while in use | Low | Wait for session to complete |

### Cursor

| Issue | Severity | Workaround |
|-------|----------|------------|
| Requires `better-sqlite3` native module | Medium | Install build tools |
| May not detect Cursor if installed in non-standard location | Low | Manually configure path |

### Codex

| Issue | Severity | Workaround |
|-------|----------|------------|
| Session format may change between versions | Low | Update AIInsight |

## Limitations

### Current Limitations

1. **Single organization per user** — Multi-org support planned for future
2. **No real-time sync** — Sync runs on interval (default: 5 minutes)
3. **No prompt storage** — By design for privacy
4. **Limited Windows support** — Some providers not detected on Windows
5. **No mobile dashboard** — Dashboard optimized for desktop

### Planned Improvements

See [Roadmap](../roadmap.md) for planned features.

## Workarounds

### Common Workarounds

| Issue | Workaround |
|-------|------------|
| Provider not detected | Run `aiinsight providers` to check detection |
| Sync timeout | Run sync with `--force` flag |
| Email not received | Check spam folder, resend from dashboard |
| Dashboard slow | Reduce date range, clear browser cache |
| Agent offline | Restart agent with `aiinsight sync` |

## Reporting Issues

When reporting issues, include:

1. **Version:** `aiinsight --version`
2. **OS:** Operating system and version
3. **Steps to reproduce**
4. **Expected behavior**
5. **Actual behavior**
6. **Logs:** `aiinsight --verbose` output

## Related Documentation

- [Troubleshooting](../getting-started/troubleshooting.md) — Common issues and solutions
- [FAQ](../getting-started/faq.md) — Common questions
- [GitHub Issues](https://github.com/priya/aiinsight/issues) — Report bugs
