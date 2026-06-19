# AIInsight Frontend — Pending Work

> Updated after production readiness stabilization sprint. Items grouped by priority.

---

## P0 — Critical (Blocks launch)

**All P0 items COMPLETED.** No blockers remain.

---

## P1 — High (Polish & completeness)

**All P1 items COMPLETED.** No high-priority blockers remain.

---

## P2 — Medium (UX improvements)

- [ ] **Auth error boundary** — `src/app/(auth)/error.tsx` is missing. Auth pages fall back to root `error.tsx` but should have their own boundary.
- [ ] **Breadcrumb navigation** — Dashboard has no breadcrumbs. Add `Breadcrumb` component to `TopBar` for nested routes (e.g., Sessions > [id]).
- [ ] **Pagination on all tables** — Sessions page has pagination. Models, Users, Projects, Providers pages need it too.
- [ ] **Empty state illustrations** — Empty states use icons. Add subtle SVG illustrations for better visual appeal.
- [ ] **Skeleton variety** — Replace generic `Skeleton` with context-specific skeletons (chart skeleton, table skeleton, card skeleton).
- [ ] **Keyboard shortcuts** — Add keyboard shortcut hints in dropdowns and menus (e.g., `⌘K` for search, `⌘/` for shortcuts).
- [ ] **Copy-to-clipboard** — Add copy buttons on session IDs, machine hostnames, code snippets.
- [ ] **Confirmation dialogs** — Add `AlertDialog` before destructive actions (revoke key, delete session data, etc.).
- [ ] **Onboarding progress persistence** — Onboarding wizard starts from step 1 every time. Save progress to localStorage or API.
- [ ] **Email verification flow** — Verify email page is static. Wire up actual API call to resend verification email.
- [ ] **Forgot password flow** — Forgot password page simulates API call. Connect to real `POST /api/v1/auth/forgot-password` endpoint.
- [ ] **Apple touch icon** — Metadata references `apple-touch-icon.png` but file doesn't exist in `public/`.
- [ ] **OG image** — `og.png` doesn't exist in `public/`. Create a branded Open Graph image.
- [ ] **Lint cleanup** — 33 unused import warnings across 15 files. Remove unused imports and variables.
- [ ] **eslint-config migration** — `next lint` is deprecated in Next.js 15. Migrate to ESLint CLI (`npx @next/codemod@canary next-lint-to-eslint-cli`).

---

## P3 — Low (Nice to have)

- [ ] **Animated route transitions** — Add `framer-motion` page transition wrapper for smooth navigation between pages.
- [ ] **Scroll-to-top** — Pages don't auto-scroll to top on navigation. Add `ScrollRestoration` or manual scroll-to-top.
- [ ] **Page meta titles** — Only root has metadata. Add per-page `generateMetadata` for SEO (pricing, docs, login, etc.).
- [ ] **Analytics integration** — No analytics. Consider Plausible, PostHog, or Vercel Analytics for usage tracking.
- [ ] **A11y audit** — Run axe-core or Lighthouse accessibility audit. Fix any contrast, focus, or ARIA issues.
- [ ] **E2E tests** — No tests exist. Add Playwright or Cypress tests for critical flows: register → onboarding → dashboard → sessions.
- [ ] **Unit tests** — Add Vitest tests for utility functions (`cn`, `formatCurrency`, `formatTokens`, etc.).
- [ ] **Storybook** — Document UI components in Storybook for design system reference.
- [ ] **i18n** — Currently English only. Add `next-intl` or similar for internationalization support.
- [ ] **PWA support** — Add service worker and manifest for offline-capable dashboard.
- [ ] **Performance audit** — Bundle analysis to identify large dependencies. Consider lazy-loading Recharts, Framer Motion.

---

## Technical debt (resolved)

All original technical debt items have been resolved:

- `CreateApiKeyResponse` — Fixed with proper `last_used_at` and `expires_at` fields
- `OverviewPage.tsx` — Unused variables cleaned up
- `ProvidersPage.tsx` — Unused imports removed
- `TrendsPage.tsx` — Unused imports and `SkeletonCard` function removed
- `avatar.tsx` — `alt` attribute added with empty string default
- `sessions/page.tsx` — `scope="col"` added to `<th>` elements

---

## Lint warnings (remaining)

33 warnings across 15 files (0 errors):

| File | Warnings |
|------|----------|
| `forgot-password/page.tsx` | unused `data` |
| `reset-password/page.tsx` | unused `data` |
| `verify-email/page.tsx` | unused `Check` |
| `machines/[id]/page.tsx` | unused `Cpu`, `Monitor`, `Clock` |
| `settings/api-keys/page.tsx` | unused `ApiKey`, `CardHeader`, `CardTitle`, `CardDescription` |
| `docs/page.tsx` | unused `ArrowRight` |
| `marketing/page.tsx` | unused `Lightbulb`, `Eye`, `ChevronDown`, `Github`, `Clock`, `copiedCommand`, `copyCommand` |
| `AreaChart.tsx` | unused `_dk`, missing hook dependency |
| `ProviderChart.tsx` | unused `Legend` |
| `StackedBarChart.tsx` | unused `Cell` |
| `TrendChart.tsx` | unused `Legend`, `title`, `getValue` |
| `Sidebar.tsx` | unused `Separator` |
| `ModelsPage.tsx` | unused `ModelAnalytics`, `BarChart3`, `Zap` |
| `OverviewPage.tsx` | unused `ArrowUpRight`, `useOnboardingProgress` |
| `ProvidersPage.tsx` | unused `totalTokens` |

---

## Completed in stabilization sprint

| Item | Status |
|------|--------|
| Env validation (Zod) | Done |
| Server-side route protection (middleware) | Done |
| Auth cookie sync | Done |
| Error boundaries (root, dashboard, marketing) | Done |
| Loading skeletons (dashboard, marketing, auth) | Done |
| Dark mode flash prevention | Done |
| Command palette (Cmd+K) | Done |
| Mobile sidebar (Sheet) | Done |
| Toast notifications (sonner) | Done |
| Session filters (provider, sort) | Done |
| Settings tabs with "Coming Soon" | Done |
| CreateApiKeyResponse type fix | Done |
| Unused imports cleanup (modified files) | Done |
| Avatar alt fix | Done |
| Table accessibility (scope) | Done |
| SVG favicon | Done |
| Metadata (OG, Twitter, icons) | Done |
| metadataBase for OG images | Done |
