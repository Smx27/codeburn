# AIInsight Release Candidate Audit (RC-1)

**Date:** 2026-06-20
**Auditor:** Automated Codebase Audit
**Scope:** Beta readiness — current code, database, APIs, frontend, sync engine

---

## PART 1 — Marketing Site

| # | Item | Status |
|---|------|--------|
| 1 | Landing page | **DONE** — Full 868-line page with hero, features, pricing, FAQ, CTAs, animations |
| 2 | Pricing page | **DONE** — 3-tier pricing (Free Beta, Team, Enterprise) |
| 3 | Features page | **NOT IMPLEMENTED** — Only an anchor section on landing page, no dedicated route |
| 4 | Responsive navigation | **DONE** — Desktop nav + mobile hamburger with animated slide-down |
| 5 | Login CTA | **DONE** — Header + mobile menu |
| 6 | Register CTA | **DONE** — 6 placements (header, hero, pricing, footer) |
| 7 | Footer links | **DONE** — 4 sections (Product, Company, Legal, Support) + copyright |
| 8 | Dark mode | **DONE** — Tailwind class-based, ThemeProvider, flash prevention script |
| 9 | Metadata | **DONE** — title, description, keywords, OG, Twitter cards |
| 10 | Favicon | **PARTIAL** — SVG exists; `apple-touch-icon.png` missing (referenced in metadata) |
| 11 | OG image | **NOT IMPLEMENTED** — Referenced in metadata but file does not exist in `public/` |

**Verdict: PARTIAL** — Core marketing is complete. OG image and apple-touch-icon missing.

---

## PART 2 — Authentication

| # | Item | Status |
|---|------|--------|
| 1 | Registration | **DONE** — Full backend + frontend with org creation, team setup, argon2 hashing |
| 2 | Email verification | **PARTIAL** — Token generation works; verify-email page is a static stub (no API call); not enforced at login |
| 3 | Login | **DONE** — argon2 verification, JWT + refresh token issuance |
| 4 | Logout | **PARTIAL** — Backend revokes refresh tokens; frontend never calls the logout API |
| 5 | Refresh tokens | **DONE** — Proper rotation (single-use, 30-day expiry, SHA-256 hashed); bug: auth-context drops refresh token on login |
| 6 | Forgot password | **PARTIAL** — Backend fully implemented; frontend is a `setTimeout` stub |
| 7 | Reset password | **PARTIAL** — Backend fully implemented; frontend is a `setTimeout` stub |
| 8 | Protected routes (frontend) | **DONE** — Next.js middleware checks cookie on protected paths |
| 9 | Protected routes (API) | **DONE** — JWT + API key middleware with role-based guards |
| 10 | Rate limiting | **DONE** — 100 req/min on auth routes |

**Verdict: PARTIAL** — Core auth works. Forgot/reset password, logout backend call, and email verification frontend are stubs.

---

## PART 3 — API Key Flow

| # | Item | Status |
|---|------|--------|
| 1 | API key page exists | **DONE** — Dedicated page at `/settings/api-keys` |
| 2 | Create API key | **DONE** — `POST /api/v1/api-keys/` with `adminOrAbove` guard |
| 3 | Secret shown only once | **DONE** — Full key returned only in creation response; list query never returns it |
| 4 | Copy action | **PARTIAL** — New key copy works; SettingsPage `handleCopyKey()` for existing keys is a no-op |
| 5 | List API keys | **DONE** — `GET /api/v1/api-keys/` |
| 6 | Revoke API keys | **DONE** — `DELETE /api/v1/api-keys/:id` with confirmation dialog |
| 7 | Last used timestamp | **NOT IMPLEMENTED** — Column exists but never updated; no `UPDATE api_keys SET last_used_at` query |
| 8 | API key hashing | **DONE** — argon2 hash/verify |
| 9 | Tenant isolation | **DONE** — All CRUD scoped by `organization_id` from JWT |
| 10 | Key format `aisk_xxxxxxxxx` | **NOT IMPLEMENTED** — Actual format is `cb_` + random hex |

**Verdict: PARTIAL** — Core CRUD works. `last_used_at` never updates; key format mismatch; copy bug on existing keys.

---

## PART 4 — Agent + Sync Engine

| # | Item | Status |
|---|------|--------|
| 1 | Agent config accepts API key | **DONE** — `SyncEngineOptions` accepts `apiKey` |
| 2 | API key validation | **DONE** — Ingestion API validates via bcrypt |
| 3 | No hardcoded keys | **DONE** — All from env vars (`.env` files in repo have defaults but `.gitignore` excludes them) |
| 4 | Machine registration | **DONE** — `findOrCreateMachine()` upserts by `(org_id, hostname)` |
| 5 | MachineId persisted | **DONE** — UUID PK, FK in sessions table |
| 6 | Heartbeat updates | **PARTIAL** — Endpoint exists; sync engine never calls it |
| 7 | Offline detection | **DONE** — 5-minute threshold, 60-second polling |
| 8 | Historical sync | **DONE** — Discovers all providers, uploads everything, checksum-gated |
| 9 | Incremental sync | **DONE** — `filterNewCalls()` with `lastCallTimestamp` |
| 10 | Retries | **DONE** — Exponential backoff, max 3 retries |
| 11 | Batch uploader | **DONE** — Disk-persisted queue, 1000-item batches |
| 12 | No duplicate sessions | **DONE** — `ON CONFLICT (provider_id, external_session_id) DO UPDATE` |
| 13 | No duplicate events | **PARTIAL** — Application-level dedup only; no DB unique constraint; race condition possible |
| 14 | Watermarks | **NOT IMPLEMENTED** — Uses simple timestamp filter, no byte-offset watermarks |
| 15 | Checksums | **DONE** — SHA-256 file checksums, state persisted |
| 16 | Queue recovery | **DONE** — Disk-persisted queue, loaded on startup |
| 17 | Sync state persists | **DONE** — JSON files in `~/.config/aiinsight/sync-state/` |

**Verdict: PARTIAL** — Core sync engine works. Heartbeat not called; event dedup has race condition.

---

## PART 5 — Providers

| Provider | Parser | Sync Adapter | Cost | Historical | Incremental | Status |
|----------|--------|-------------|------|------------|-------------|--------|
| Claude | **STUB** — empty generator yields nothing | YES | Imported but unused | YES | YES | **BROKEN** |
| Codex | YES — streaming JSONL | YES | YES — per-token | YES | YES | **DONE** |
| Cursor | YES — SQLite + agentKv | YES | YES — per-token | YES | YES | **DONE** |
| Gemini | YES — JSON + JSONL | YES | YES — per-token | YES | YES | **DONE** |
| Warp | YES — SQLite | **NO** — missing adapter | YES (estimated) | NO | NO | **NO SYNC** |
| OpenCode | YES — SQLite | **NO** — missing adapter | YES | NO | NO | **NO SYNC** |

**Verdict: PARTIAL** — Codex/Cursor/Gemini fully work. Claude parser is a no-op stub. Warp/OpenCode have no sync adapters.

---

## PART 6 — Ingestion API

| # | Item | Status |
|---|------|--------|
| 1 | POST /ingest/batch | **DONE** |
| 2 | POST /ingest/events | **DONE** |
| 3 | POST /ingest/sessions | **DONE** |
| 4 | Validation | **DONE** — Zod schemas with field-level constraints |
| 5 | Authentication | **DONE** — API key + JWT support |
| 6 | Rate limiting | **DONE** — 1000 req/min |
| 7 | Error handling | **DONE** — try/catch, 400/404/500 responses |
| 8 | Tenant isolation | **PARTIAL** — `req.ingestUser.organizationId` populated but never enforced; body-supplied org ID trusted |
| 9 | No phantom organizations | **DONE** — 404 for nonexistent orgs |

**Verdict: PARTIAL** — Endpoints work. Tenant isolation bypass via body-supplied org ID.

---

## PART 7 — Dashboard API

| # | Item | Status |
|---|------|--------|
| 1 | Overview | **DONE** |
| 2 | Trends | **DONE** — daily/weekly/monthly granularity |
| 3 | Users | **DONE** |
| 4 | Providers | **DONE** |
| 5 | Models | **DONE** |
| 6 | Projects | **DONE** |
| 7 | Machines | **PARTIAL** — Detail only; no list endpoint |
| 8 | Sessions | **DONE** — Full list with pagination |
| 9 | Session detail | **DONE** |
| 10 | Machine detail | **DONE** |
| 11 | Pagination | **DONE** |
| 12 | Filtering | **DONE** — search, provider, model, user, machine, date range |
| 13 | Sorting | **DONE** — started_at, duration, tokens, cost |

**Verdict: DONE** — Minor gap: no dedicated machines list endpoint.

---

## PART 8 — Frontend

| # | Item | Status |
|---|------|--------|
| 1 | Overview | **DONE** — 6 metric cards, charts, insights, activity feed |
| 2 | Sessions | **DONE** — Search, filter, sort, pagination |
| 3 | Session Detail | **DONE** — Stats, events, token breakdown |
| 4 | Users | **DONE** — Leaderboard, charts, heatmap |
| 5 | Machines | **NOT IMPLEMENTED** — No list page; only detail via `[id]` |
| 6 | Machine Detail | **DONE** — Stats, provider breakdown, recent sessions |
| 7 | Providers | **DONE** — Health cards, trends, distribution |
| 8 | Settings | **DONE** — Tabbed: Profile, Org, API Keys, Members (stub), Billing (stub) |
| 9 | API Keys | **DONE** — Full CRUD |
| 10 | Onboarding | **DONE** — 5-step wizard (but internals are stubs) |
| 11 | Responsive layout | **DONE** — Sidebar + mobile drawer |
| 12 | Error boundaries | **DONE** — Global + scoped |
| 13 | Loading states | **DONE** — Skeletons everywhere |
| 14 | Command palette | **DONE** — Cmd+K with navigation + actions |
| 15 | Mobile sidebar | **DONE** — Sheet/drawer with full nav |
| 16 | Toast notifications | **DONE** — Sonner toasts |
| 17 | Dark mode | **DONE** — ThemeProvider, flash prevention, 5 toggle locations |

**Verdict: DONE** — 15/17 complete. Machines list page missing; onboarding wizard internals are stubs.

---

## PART 9 — Security

| # | Item | Status |
|---|------|--------|
| 1 | JWT secrets required | **DONE** — Throws at startup if missing |
| 2 | RBAC | **DONE** — ownerOnly, adminOrAbove, orgAdminOnly |
| 3 | Tenant isolation | **PARTIAL** — Ingestion API trusts body org ID over token org ID |
| 4 | Rate limiting | **PARTIAL** — Auth routes protected; dashboard non-auth routes unprotected |
| 5 | Helmet | **DONE** — Both APIs |
| 6 | CORS config | **PARTIAL** — Dashboard API yes; Ingestion API has no CORS |
| 7 | API key hashing | **DONE** — argon2 (dashboard) + bcrypt (ingestion) |
| 8 | No hardcoded secrets | **DONE** — All from env vars; `.env` files in repo have defaults but are gitignored |

**Verdict: PARTIAL** — Core security is solid. Tenant isolation bypass and missing rate limiting on dashboard routes are concerns.

---

## PART 10 — Deployment

| # | Item | Status |
|---|------|--------|
| 1 | Docker | **DONE** — 3 Dockerfiles, multi-stage builds |
| 2 | Environment variables | **PARTIAL** — `.env.example` files exist but incomplete |
| 3 | Health endpoints | **DONE** — Both APIs have `/api/v1/health` |
| 4 | Migrations | **DONE** — 14 SQL migrations with tracking table |
| 5 | Compose | **DONE** — 4 services with health checks and volumes |
| 6 | Frontend production build | **DONE** — Next.js multi-stage Docker build |

**Verdict: DONE** — Production-ready deployment.

---

## PART 11 — Documentation

| Category | Status |
|----------|--------|
| README | **DONE** — Clear structure, Mermaid diagram, quick start |
| Architecture docs | **DONE** — 14 files with diagrams |
| Database docs | **DONE** — Full schema with ERD |
| API docs | **DONE** — 686-line dashboard API doc + ingestion API doc |
| Onboarding docs | **DONE** — 3 getting-started guides |
| Agent docs | **DONE** — 265-line install guide + lifecycle docs |
| Sync engine docs | **DONE** — 195-line doc |
| Deployment docs | **DONE** — 198-line doc |

**Documentation Coverage: ~88%**

### Outdated Documents

| File | Issue |
|------|-------|
| `CONTRIBUTING.md` | References "CodeBurn" (old name), wrong repo URLs (`github.com/getagentseal/codeburn`) |
| `RELEASING.md` | References "CodeBurn" throughout, wrong npm package name |
| `SECURITY.md` | Vulnerability URL points to old repo |
| `docs/architecture.md` | Provider count says "31", actual is 28 |
| `docs/agent-installation.md` | Says Node.js 20+, actual requirement is 22.13+ |
| `docs/architecture.md` | Links to non-existent `phase-3.5` doc |
| `docs/roadmap.md` | Links to non-existent phase docs |

---

## PART 12 — End-to-End User Journey

| Step | Status | Blocker? |
|------|--------|----------|
| 1. Visit landing page | **WORKS** | — |
| 2. Register | **WORKS** | — |
| 3. Verify email | **BROKEN** — Page is a static stub; not enforced at login | No (login still works) |
| 4. Login | **WORKS** | — |
| 5. Generate API key | **WORKS** | — |
| 6. Download agent | **BROKEN** — `curl` URL doesn't exist; no installer | **BLOCKER** |
| 7. Configure agent | **BROKEN** — `aiinsight configure` command doesn't exist | **BLOCKER** |
| 8. Run sync | **WORKS** (if manually configured) | — |
| 9. Machine appears | **PARTIAL** — Backend works; no machines list page | **BLOCKER** |
| 10. Sessions appear | **WORKS** | — |
| 11. Dashboard updates | **WORKS** | — |
| 12. Invite teammate | **BROKEN** — No frontend UI; backend-only | **BLOCKER** |
| 13. Teammate joins | **BROKEN** — Login page ignores invitation token | **BLOCKER** |
| 14. Second machine syncs | **WORKS** | — |

**E2E Journey Verdict: FAILS** — 5 blockers prevent completion.

---

## PART 13 — Technical Debt

| Category | Count | Level |
|----------|-------|-------|
| `as any` type assertions | 5 (1 in prod, 4 in tests) | **LOW** |
| `console.log`/`console.error` in prod | 11 | **LOW** |
| TODO/FIXME/HACK comments | 0 | **LOW** |
| Hardcoded `http://localhost` URLs | 8 (5 are env fallbacks) | **LOW** |
| `any` type annotations total | 31 (19 source, 12 tests) | **LOW** |

**Technical Debt Level: LOW**

---

## FINAL VERDICT

| Metric | Score |
|--------|-------|
| **Beta Completion %** | **72%** |
| **Architecture Documentation Coverage %** | **88%** |
| **Sync Engine Health %** | **85%** |
| **API Key Flow Health %** | **80%** |
| **Dashboard Health %** | **90%** |
| **Security Health %** | **75%** |
| **Documentation Health %** | **88%** |

### Remaining P0 Blockers (ordered by severity)

1. **No `configure` CLI command** — Users cannot configure the agent to connect to the cloud. The onboarding wizard tells users to run `aiinsight configure --key <KEY>` but this command does not exist.

2. **No agent installer/distribution** — References `curl -fsSL https://get.aiinsight.dev | sh` but no install script exists. No binary/SEA distribution mechanism.

3. **Tenant isolation bypass in ingestion API** — `req.ingestUser.organizationId` is populated by auth middleware but ignored; body-supplied `organizationId` is trusted. Org A can write data to Org B.

4. **No invitation UI in frontend** — Settings > Members shows "Coming Soon". Team invitation flow is backend-only with no way to create/accept invitations from the UI.

5. **Invitation token ignored on login** — Login page receives `/login?invitation=TOKEN` but never reads it or calls the accept endpoint.

### Remaining P1 Issues (can launch with these)

1. **Forgot-password frontend is a stub** — Both forgot and reset password pages use `setTimeout` instead of real API calls.

2. **Logout doesn't call backend** — Refresh tokens are never invalidated server-side.

3. **No machines list page** — Only detail view exists; no `/machines/` route.

4. **Verify-email page is a static stub** — No API call, resend button is dead.

5. **No heartbeat from sync engine** — Machines go stale/offline even while syncing.

6. **Claude provider parser is a no-op** — Empty generator yields nothing; sync discovers but never parses.

7. **Event dedup race condition** — Application-level SELECT-then-INSERT with no DB constraint.

8. **`last_used_at` never updates** on API keys.

9. **Missing OG image and apple-touch-icon** — Social sharing shows broken image.

10. **Outdated docs** — CONTRIBUTING.md, RELEASING.md, SECURITY.md still reference "CodeBurn".

### Ready For External Beta Users

**NO**

The agent cannot be installed or configured. The team invitation flow is non-functional. The ingestion API has a tenant isolation bypass.

### Ready For Node SEA Packaging

**NO**

The `configure` command does not exist, and there is no install script or binary distribution mechanism.

### Recommended Next Step

**1. Fix blockers** — The 5 P0 blockers must be resolved before beta. The agent configuration and distribution flow is the critical path; without it, no user can complete the journey from registration to seeing data on the dashboard.
