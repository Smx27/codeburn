# AIInsight Frontend — Pending Work

> Generated after the UX Pro Max overhaul. Items grouped by priority.

---

## P0 — Critical (Blocks launch)

- [ ] **API proxy rewrite** — `next.config.js` rewrites `/api/*` to `localhost:3002` but no env var is documented. Add `NEXT_PUBLIC_API_URL` to `.env.example` and validate it at startup.
- [ ] **Auth middleware** — No Next.js middleware protects dashboard routes. Currently client-side `useEffect` redirects. Add `middleware.ts` to guard `(dashboard)` and `(onboarding)` route groups server-side.
- [ ] **Error boundaries** — No `error.tsx` files exist. Add `error.tsx` at `app/error.tsx`, `app/(dashboard)/error.tsx`, and per-page boundaries for graceful failure.
- [ ] **`loading.tsx` files** — Add skeleton loading states at route level (`app/(dashboard)/loading.tsx`, `app/(marketing)/loading.tsx`) for instant feedback on navigation.

---

## P1 — High (Polish & completeness)

- [ ] **Command palette** — `cmdk` is installed, `Command` component exists, but no command palette is wired up. Add `Cmd+K` / `Ctrl+K` global shortcut with search, navigation, and actions.
- [ ] **Mobile sidebar** — Sidebar is collapsed/expanded but not responsive. Add slide-over sheet on mobile (`< md` breakpoint) with overlay backdrop.
- [ ] **Toast notifications** — No toast system. Install `sonner` or use shadcn toast for success/error feedback on mutations (create key, delete key, copy, etc.).
- [ ] **Session filters UI** — Sessions page has search but no provider/user/date range filter dropdowns. Add filter popover with `Select` components.
- [ ] **Providers page charts** — Providers page renders `ProvidersPage` component but chart data might be empty. Verify Recharts render with real/mock data.
- [ ] **Trends page granularity toggle** — Trends page should have daily/weekly/monthly toggle (already in API types). Wire up the `PeriodSelector` + granularity switch.
- [ ] **Settings tabs** — Settings page shows profile/organization/API keys/members/billing tabs. Members and billing tabs are placeholders — add content or clearly mark as "Coming Soon".
- [ ] **Dark mode flash** — Root layout doesn't set initial `class="dark"` on `<html>`. Add script to read localStorage/theme before paint to avoid FOUC.
- [ ] **Favicon & OG image** — `public/` is empty. Add favicon, apple-touch-icon, and OG image for social previews.

---

## P2 — Medium (UX improvements)

- [ ] **Breadcrumb navigation** — Dashboard has no breadcrumbs. Add `Breadcrumb` component to `TopBar` for nested routes (e.g., Sessions > [id]).
- [ ] **Pagination on all tables** — Sessions page has pagination. Models, Users, Projects, Providers pages need it too.
- [ ] **Empty state illustrations** — Empty states use icons. Add subtle SVG illustrations for better visual appeal.
- [ ] **Skeleton variety** — Replace generic `Skeleton` with context-specific skeletons (chart skeleton, table skeleton, card skeleton).
- [ ] **Keyboard shortcuts** — Add keyboard shortcut hints in dropdowns and menus (e.g., `⌘K` for search, `⌘/` for shortcuts).
- [ ] **Copy-to-clipboard** — Add copy buttons on API keys, session IDs, machine hostnames, code snippets.
- [ ] **Confirmation dialogs** — Add `AlertDialog` before destructive actions (revoke key, delete session data, etc.).
- [ ] **Onboarding progress persistence** — Onboarding wizard starts from step 1 every time. Save progress to localStorage or API.
- [ ] **Email verification flow** — Verify email page is static. Wire up actual API call to resend verification email.
- [ ] **Forgot password flow** — Forgot password page simulates API call. Connect to real `POST /api/v1/auth/forgot-password` endpoint.

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

## Files to create

| File | Purpose |
|---|---|
| `src/middleware.ts` | Auth guard for protected routes |
| `src/app/error.tsx` | Root error boundary |
| `src/app/(dashboard)/error.tsx` | Dashboard error boundary |
| `src/app/(dashboard)/loading.tsx` | Dashboard skeleton loader |
| `src/app/(marketing)/loading.tsx` | Marketing skeleton loader |
| `src/components/ui/toast.tsx` | Toast notification system |
| `src/components/ui/sheet.tsx` | Mobile sidebar slide-over |
| `src/components/ui/breadcrumb.tsx` | Breadcrumb navigation |
| `src/components/ui/command.tsx` | Wire up Cmd+K palette |
| `public/favicon.ico` | Favicon |
| `public/og.png` | Open Graph image |
| `.env.example` | Document env vars |

---

## Dependencies to install

```bash
npm install sonner          # Toast notifications
npm install next-intl       # i18n (optional)
npm install @next/bundle-analyzer  # Bundle analysis (optional)
```

---

## Technical debt

- `components/pages/SettingsPage.tsx:113` — Type assertion `{ ...result, last_used_at: null, expires_at: null } as ApiKey` to work around `CreateApiKeyResponse` not extending `ApiKey`. Fix with proper union type or API response shape.
- `components/pages/OverviewPage.tsx` — Multiple unused variables (`projectsLoading`, `providerNames`, `totalTokens`, `hasData`). Clean up.
- `components/pages/ProvidersPage.tsx` — Unused imports (`Activity`, `Zap`, `totalCost`, `totalTokens`). Clean up.
- `components/pages/TrendsPage.tsx` — Unused imports (`TrendingDown`, `SkeletonCard`). Clean up.
- `components/ui/avatar.tsx:24` — `<img>` missing `alt` prop. Add `alt=""` for decorative avatar fallback.
