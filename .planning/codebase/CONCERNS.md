# Codebase Concerns

**Analysis Date:** 2026-06-12

## Tech Debt

**Monolithic Parser (parser.ts):**
- Issue: `src/parser.ts` is 2320 lines and handles session parsing, caching, cross-provider merging, and date filtering in a single file
- Files: `src/parser.ts`, `src/main.ts`
- Impact: Difficult to modify parsing logic without risk of regression in unrelated features; merge conflicts are frequent
- Fix approach: Extract caching, cross-provider merging, and date filtering into separate modules. Consider a `ParserOrchestrator` pattern with smaller composable units

**Giant Optimize Module:**
- Issue: `src/optimize.ts` is 2494 lines — the largest file in the codebase — containing detection heuristics, scoring, and display logic all interleaved
- Files: `src/optimize.ts`
- Impact: Hard to add new optimization findings without touching unrelated detectors; test surface area is enormous
- Fix approach: Split into `optimize/detectors/`, `optimize/scoring.ts`, and `optimize/display.ts`. Each detector becomes a self-contained module with its own threshold constants

**Provider Loading Repetition:**
- Issue: `src/providers/index.ts` has 10 nearly identical lazy-loader functions (`loadAntigravity`, `loadWarp`, `loadForge`, `loadGoose`, `loadCursor`, `loadOpenCode`, `loadCursorAgent`, `loadCrush`, `loadVercelGateway`) with copy-pasted try/catch/import logic
- Files: `src/providers/index.ts`
- Impact: Adding a new provider requires duplicating the load pattern; each function is 12 lines of boilerplate
- Fix approach: Create a `createLazyProvider(name, importFn)` factory. The existing `coreProviders` array pattern is fine for eagerly-loaded providers

**Module-level Singleton Caches:**
- Issue: Multiple files use `let memCache: ... | null = null` as module-level mutable state (`src/codex-cache.ts:34`, `src/models.ts:81-83`, `src/parser.ts` sessionCache)
- Files: `src/codex-cache.ts`, `src/models.ts`, `src/parser.ts`
- Impact: Tests can interfere with each other; difficult to reason about cache invalidation; no TTL eviction for model pricing cache
- Fix approach: Encapsulate caches in classes with explicit `clear()` and `invalidate()` methods. Consider a shared cache registry

**Hardcoded JWT Secret Fallback:**
- Issue: `apps/dashboard-api/src/middlewares/auth.middleware.ts:6` uses `process.env.JWT_SECRET || 'codeburn-dev-secret-change-in-production'` — a hardcoded secret that will silently authenticate any token if `JWT_SECRET` is unset
- Files: `apps/dashboard-api/src/middlewares/auth.middleware.ts`
- Impact: Production deployment without `JWT_SECRET` env var results in fully compromised authentication
- Fix approach: Throw an error at startup if `JWT_SECRET` is not set or is the default value. Add a startup validator in `apps/dashboard-api/src/index.ts`

**SQL Injection Risk in Ingestion API:**
- Issue: `apps/ingestion-api/src/controllers/ingestion.controller.ts:138-150` passes `event.sessionId` directly into the database without verifying it maps to a valid session. A malicious client could inject arbitrary session IDs
- Files: `apps/ingestion-api/src/controllers/ingestion.controller.ts`
- Impact: Data integrity — events can be attached to non-existent sessions, breaking referential integrity
- Fix approach: Validate that `sessionMap.get(event.sessionId)` returns a valid internal session ID, or reject the batch

## Known Bugs

**`filterNewCalls` is a No-Op:**
- Symptoms: `IncrementalSyncService.filterNewCalls()` at `packages/sync-engine/src/services/incrementalSync.service.ts:187-190` accepts `lastHash` but returns all calls unfiltered when `lastHash` is truthy — the deduplication logic was never implemented
- Files: `packages/sync-engine/src/services/incrementalSync.service.ts`
- Trigger: Any incremental sync after the first sync will re-upload all events, causing duplicate data
- Workaround: None — this is a silent data duplication bug

**Inconsistent Cache Write Error Handling:**
- Symptoms: `src/parser.ts:2263` uses `try { await saveCache(diskCache) } catch {}` — cache save failures are silently swallowed. If the cache file is corrupted, the user sees no error and performance degrades on every subsequent run
- Files: `src/parser.ts`
- Trigger: Disk full, permissions issue, or corrupted cache file
- Workaround: Run `codeburn --clear-cache` (if such a flag exists) or manually delete `~/.cache/codeburn/session-cache.json`

## Security Considerations

**Prototype Pollution Vectors:**
- Risk: Session JSONL files contain user-controlled data (tool names, model names, bash commands). Bracket-assign on these objects can pollute `Object.prototype`
- Files: `src/providers/*.ts`, `src/parser.ts`
- Current mitigation: Semgrep rule `.semgrep/rules/no-bracket-assign-hot-paths.yml` in CI; dedicated test `tests/security/prototype-pollution.test.ts`
- Recommendations: The semgrep rule only covers `src/providers/` and `src/parser.ts`. Extend to cover `src/optimize.ts` and `src/session-cache.ts` where `record[key] = value` patterns exist

**Config File Race Condition:**
- Risk: `src/config.ts:90` uses `randomBytes(8).toString('hex')` for temp file naming, but two concurrent callers could still race if they generate the same random suffix (probability ~1/2^64, non-zero)
- Files: `src/config.ts`
- Current mitigation: Random suffix on temp file; `rename()` atomicity
- Recommendations: Use `mkdtemp()` for atomic directory creation or lock the config file with `flock`

**API Key Prefix Leakage:**
- Risk: `apps/dashboard-api/src/middlewares/auth.middleware.ts:73` does `apiKey.slice(0, 8)` as a lookup prefix — the first 8 characters of an API key are used as a database index. If the database is compromised, an attacker can brute-force the remaining ~24 characters
- Files: `apps/dashboard-api/src/middlewares/auth.middleware.ts`
- Current mitigation: bcrypt hash comparison after prefix match
- Recommendations: Consider using a separate `key_hash_prefix` column indexed with a hash, not a plaintext prefix

**Menubar Installer Downloads Over HTTP:**
- Risk: `src/menubar-installer.ts:105-116` fetches release metadata from GitHub API over HTTPS, then follows `browser_download_url` redirects. GitHub download URLs redirect to CDN endpoints — if an attacker controls DNS, they could serve a malicious zip
- Files: `src/menubar-installer.ts`
- Current mitigation: SHA-256 checksum verification; `codesign --verify` on the extracted bundle
- Recommendations: Pin the expected checksum in the installer code for known-good releases, or use GitHub's artifact attestation API

**SQLite Module Monkey-Patching:**
- Risk: `src/sqlite.ts:61-74` patches `process.emit` to suppress `ExperimentalWarning`. This is a global side effect that affects all code in the process
- Files: `src/sqlite.ts`
- Current mitigation: Restores original `process.emit` via `process.nextTick(restore)`
- Recommendations: This is acceptable for a CLI tool but should be documented. If codeburn ever becomes a library, this pattern will break consumers

## Performance Bottlenecks

**Full JSONL Re-parse on Every CLI Run:**
- Problem: Every `codeburn` invocation discovers all session sources, checks file fingerprints, and re-parses changed files. For users with thousands of sessions, this can take 5-15 seconds
- Files: `src/parser.ts:2231-2319`
- Cause: Session cache (`session-cache.json`) helps, but any file change triggers a full re-parse of that file's JSONL
- Improvement path: Implement incremental parsing (only parse new lines after `lastCompleteLineOffset`). The `CachedFile.lastCompleteLineOffset` field exists but is not leveraged during re-parse

**Optimize Command Scans All JSONL Files:**
- Problem: `src/optimize.ts` runs `collectJsonlFiles()` which walks the entire session directory tree and reads every `.jsonl` file, even when only recent data is needed
- Files: `src/optimize.ts:264-276`
- Cause: The optimizer doesn't use the session cache — it reads raw JSONL directly
- Improvement path: Pre-filter files by mtime before reading. Use the session cache's `CachedFile.fingerprint.mtimeMs` to skip stale files

**Model Pricing Fetch Blocks CLI Startup:**
- Problem: `loadPricing()` in `src/models.ts` fetches from `https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json` with an 8s timeout, blocking every CLI command
- Files: `src/models.ts`, `src/main.ts:126`
- Cause: Pricing data must be loaded before any cost calculation. The bundled snapshot (`litellm-snapshot.json`) is the fallback, but the fetch still blocks
- Improvement path: Run pricing fetch in background; use bundled snapshot synchronously. Only block on fetch for commands that need fresh pricing (e.g., `codeburn models`)

**BatchUploader Infinite Loop Risk:**
- Problem: `packages/sync-engine/src/uploader/batchUploader.ts:125-141` processes the queue in a `while` loop but only breaks on error — if `uploadWithRetry` succeeds for the first batch but the queue grows during processing, it could run indefinitely
- Files: `packages/sync-engine/src/uploader/batchUploader.ts`
- Cause: No upper bound on queue size or processing time
- Improvement path: Add a maximum batch count per `processQueue()` invocation, or use a callback/event-driven pattern instead of polling

## Fragile Areas

**Provider Parser Contracts:**
- Files: `src/providers/types.ts`, `src/providers/*.ts`
- Why fragile: Each provider parser (`claude.ts`, `cursor.ts`, `codex.ts`, etc.) must implement `discoverSessions()` and `createSessionParser()` but there's no shared test harness or contract validation. A breaking change in `ParsedProviderCall` type silently breaks providers that don't update
- Safe modification: Always run `npm test` with all provider fixtures. The `tests/providers/*.test.ts` files each test one provider, but coverage varies — `tests/providers/claude-config-dirs.test.ts` has only 2 tests
- Test coverage: Good for cursor/codex/claude; sparse for `goose`, `crush`, `openclaw`

**Session Cache Versioning:**
- Files: `src/session-cache.ts:83`
- Why fragile: `CACHE_VERSION = 4` — bumping this version invalidates all caches for all users. If a version bump is deployed before all users update, old CLI versions will fail to read new cache files
- Safe modification: Always bump version on schema changes. Consider backward-compatible migration for at least one version
- Test coverage: `tests/session-cache.test.ts` exists but doesn't test version migration

**Cross-Provider Project Merging:**
- Files: `src/parser.ts:2289-2318`
- Why fragile: The `crossProviderKey` function normalizes paths by stripping leading slashes and lowercasing. This works for Unix paths but has edge cases: Windows paths, symlinks, and case-sensitive filesystems (macOS default is case-insensitive but can be case-sensitive)
- Safe modification: Test with mixed-case project names and Windows-style paths
- Test coverage: No dedicated tests for cross-provider merge logic

**SQLite Compatibility:**
- Files: `src/sqlite.ts`
- Why fragile: `node:sqlite` is experimental in Node 22/23 and stable in Node 24. The `loadDriver()` function monkey-patches `process.emit` to suppress warnings — this pattern may break if Node changes the warning format
- Safe modification: Always test on Node 22, 23, and 24 before release
- Test coverage: `tests/blob-to-text.test.ts` exists but doesn't test the warning suppression

## Scaling Limits

**Session Cache File Size:**
- Current capacity: ~10MB for power users with thousands of sessions
- Limit: JSON parse time grows linearly; `session-cache.json` can exceed 50MB for enterprise users
- Scaling path: Switch to SQLite for the session cache (ironic given the existing `src/sqlite.ts` wrapper), or shard by provider

**Provider Count Growth:**
- Current capacity: 30+ providers in `src/providers/`
- Limit: Each new provider adds ~300-500 lines and must be registered in `src/providers/index.ts`. The lazy-loading pattern helps startup time but the import graph is growing
- Scaling path: Auto-discover providers from a `providers/` directory, or use a plugin architecture

## Dependencies at Risk

**`node:sqlite` (Experimental API):**
- Risk: Used in `src/sqlite.ts` for Cursor/OpenCode session parsing. The API is experimental in Node 22/23 and may change between minor versions
- Impact: SQLite-based providers (Cursor, OpenCode) break on Node version updates
- Migration plan: Pin Node 24+ for production use; add version check in `loadDriver()`

**`ink` (React Terminal UI):**
- Risk: `ink@7.0.0` is used for `src/dashboard.tsx` and `src/compare.tsx`. Ink depends on React 19, which is still relatively new
- Impact: React breaking changes could break dashboard rendering
- Migration plan: Monitor Ink releases; consider plain `chalk` output for simple dashboards

**LiteLLM Pricing JSON:**
- Risk: `src/models.ts` fetches pricing data from `https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json`. This URL has no stability guarantee
- Impact: If the URL changes or the JSON schema changes, pricing breaks silently (users see $0 for unknown models)
- Migration plan: Maintain bundled snapshot (`src/data/litellm-snapshot.json`) as primary; fetch as enhancement only

## Missing Critical Features

**No Structured Error Reporting:**
- Problem: Errors are logged to stderr via `console.error` or silently swallowed (`catch {}`). There's no error code system, no structured error objects, and no way for users to report errors with context
- Blocks: Debugging production issues; user support; automated error tracking

**No Rate Limiting on Ingestion API:**
- Problem: `apps/ingestion-api/` has no rate limiting middleware. A misconfigured sync engine could overwhelm the database
- Blocks: Production deployment at scale

**No Database Migrations in CI:**
- Problem: `apps/ingestion-api/src/database/migrate.ts` exists but CI (`ci.yml`) only runs semgrep — it doesn't test migrations or run integration tests against a real database
- Blocks: Confidence in schema changes

## Test Coverage Gaps

**`src/optimize.ts` (2494 lines):**
- What's not tested: Most detector heuristics are tested in `tests/optimize.test.ts`, but the scoring/ranking logic and display formatting have minimal coverage
- Files: `src/optimize.ts`, `tests/optimize.test.ts`
- Risk: Changes to scoring weights or grade thresholds could silently degrade optimization quality
- Priority: Medium

**`src/parser.ts` Cross-Provider Merge:**
- What's not tested: The `crossProviderKey` normalization and merge logic in `src/parser.ts:2289-2318` has no dedicated tests
- Files: `src/parser.ts`
- Risk: A path normalization bug could cause duplicate or missing projects in reports
- Priority: High

**`packages/sync-engine/` Incremental Sync:**
- What's not tested: `IncrementalSyncService.filterNewCalls()` is untested and currently a no-op. The entire incremental sync flow has no unit tests
- Files: `packages/sync-engine/src/services/incrementalSync.service.ts`
- Risk: Data duplication in production sync
- Priority: High

**`apps/dashboard-api/` Authentication:**
- What's not tested: The JWT and API key authentication flows in `apps/dashboard-api/src/middlewares/auth.middleware.ts` have no tests
- Files: `apps/dashboard-api/src/middlewares/auth.middleware.ts`
- Risk: Authentication bypass or token validation bugs
- Priority: High

**Provider-Specific Edge Cases:**
- What's not tested: Edge cases in provider parsers (malformed JSONL, missing fields, Unicode content) are only tested for cursor/codex/claude
- Files: `src/providers/*.ts`, `tests/providers/*.test.ts`
- Risk: Parse failures in less-tested providers silently drop usage data
- Priority: Medium

---

*Concerns audit: 2026-06-12*
