# Dashboard Pages

## Overview

The dashboard is a Next.js 15 application with 9 analytics pages plus settings.

| Page | Route | Purpose |
|------|-------|---------|
| Overview | `/dashboard` | High-level usage summary |
| Sessions | `/sessions` | Session list with filters |
| Session Detail | `/sessions/[id]` | Individual session with events |
| Users | `/users` | Per-user analytics |
| Machine Detail | `/machines/[id]` | Individual machine metrics |
| Providers | `/providers` | Per-provider analytics |
| Models | `/models` | Per-model analytics |
| Projects | `/projects` | Per-project analytics |
| Trends | `/trends` | Time-series charts |
| Settings | `/settings` | Org settings, API keys |
| Agent Setup | `/settings/agents` | Agent installation guide |

---

## Overview (`/dashboard`)

**Purpose**: High-level usage summary.

**Data Source**: `GET /api/v1/dashboard/overview`

| Section | Data |
|---------|------|
| Total Sessions | `totalSessions` |
| Total Users | `totalUsers` |
| Total Tokens | `totalTokens` |
| Total Cost | `totalCost` |
| Active Providers | `activeProviders` |

**Filters**: Period selector (24h, 7d, 30d, 90d, 1y)

---

## Sessions (`/sessions`)

**Purpose**: Browse and filter all sessions.

**Data Source**: `GET /api/v1/sessions`

| Column | Field |
|--------|-------|
| Provider | `providerName` |
| Project | `projectName` |
| Started | `startedAt` |
| Events | `eventCount` |
| Tokens | `totalTokens` |
| Cost | `totalCost` |

**Filters**:
- Search: Free text on project name
- Provider: Dropdown (Claude, Codex, Cursor, Gemini)
- Date range: Start/end date
- Sort: Started, tokens, cost (ascending/descending)
- Pagination: 20 per page

---

## Session Detail (`/sessions/[id]`)

**Purpose**: View individual session with full event timeline.

**Data Source**: `GET /api/v1/sessions/:id`

| Section | Data |
|---------|------|
| Overview | Provider, project, started, events count, tokens, cost |
| Usage Breakdown | Input tokens, output tokens, cache read, cache write |
| Event Timeline | Chronological list of events with model, tokens, cost |

---

## Users (`/users`)

**Purpose**: Per-user analytics.

**Data Source**: `GET /api/v1/dashboard/users`

| Column | Field |
|--------|-------|
| Email | `userEmail` |
| Name | `userName` |
| Sessions | `sessionCount` |
| Tokens | `tokenCount` |
| Cost | `cost` |

**Filters**: Period selector, limit (10, 20, 50)

---

## Machine Detail (`/machines/[id]`)

**Purpose**: View individual machine metrics and recent sessions.

**Data Source**: `GET /api/v1/machines/:id`

| Section | Data |
|---------|------|
| Machine Info | Hostname, OS, architecture, agent version, status, first/last seen |
| Usage Metrics | Total sessions, events, tokens, cost |
| Recent Sessions | Last 10 sessions with token/cost data |
| Cost by Model | Aggregated cost per model |
| Cost Over Time | Daily cost trend (last 30 days) |
| Agent Tokens | List of issued tokens with last used |

---

## Providers (`/providers`)

**Purpose**: Per-provider analytics.

**Data Source**: `GET /api/v1/dashboard/providers`

| Column | Field |
|--------|-------|
| Provider | `providerName` |
| Sessions | `totalSessions` |
| Tokens | `totalTokens` |
| Cost | `totalCost` |
| Share | `percentageOfTotal` |

**Filters**: Period selector

---

## Models (`/models`)

**Purpose**: Per-model analytics.

**Data Source**: `GET /api/v1/dashboard/models`

| Column | Field |
|--------|-------|
| Model | `model` |
| Sessions | `sessionCount` |
| Tokens | `totalTokens` |
| Cost | `totalCost` |
| Share | `percentageOfTotal` |

**Filters**: Period selector, limit

---

## Projects (`/projects`)

**Purpose**: Per-project analytics.

**Data Source**: `GET /api/v1/dashboard/projects`

| Column | Field |
|--------|-------|
| Project | `projectName` |
| Sessions | `sessionCount` |
| Tokens | `tokenCount` |
| Cost | `cost` |

**Filters**: Period selector, limit

---

## Trends (`/trends`)

**Purpose**: Time-series charts showing usage over time.

**Data Source**: `GET /api/v1/dashboard/trends`

| Chart | Data |
|-------|------|
| Sessions over time | `sessions` per day/week/month |
| Tokens over time | `tokens` per day/week/month |
| Cost over time | `cost` per day/week/month |
| Users over time | `users` per day/week/month |

**Filters**: Period selector, granularity (daily, weekly, monthly)

---

## Settings (`/settings`)

**Purpose**: Organization settings and API key management.

**Data Source**: `GET /api/v1/organizations/current`, `GET /api/v1/api-keys`

| Section | Data |
|---------|------|
| Organization | Name, created date |
| Settings | Timezone, currency, retention days |
| API Keys | List with name, prefix, role, created, last used |

**Actions**:
- Update organization name
- Create API key (shows key once)
- Revoke API key

---

## Agent Setup (`/settings/agents`)

**Purpose**: Agent installation guide.

**Data Source**: `GET /api/v1/enrollment-keys`

| Section | Data |
|---------|------|
| Installation Steps | `aiinsight init`, `aiinsight sync` |
| Enrollment Keys | List with name, prefix, created, last used |

**Actions**:
- Generate enrollment key
- Revoke enrollment key
- Rotate enrollment key
