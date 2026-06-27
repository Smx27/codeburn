# Niriksh Design System

> The single source of truth for all visual design across dashboard-web, dashboard-api emails, and any future surfaces.

## Brand

- **Name**: Niriksh (never AIInsight, never SENTINEL)
- **Tagline**: AI Token Usage Intelligence
- **Logo text**: `NIRIKSH` (all caps, Sora font, tracking-tight)
- **Support email**: support@niriksh.dev

---

## Color System

### Primary Palette

| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| Primary | `119 99% 46%` | `#77FF47` | CTAs, active states, links, accents |
| Primary Hover | `119 99% 42%` | — | Button hover |
| Primary Subtle | `119 50% 10%` | — | Icon backgrounds |
| Primary Muted | `119 50% 14%` | — | Subtle backgrounds |

### Background Palette

| Token | HSL | Usage |
|-------|-----|-------|
| Background | `240 50% 3%` | Page background |
| Background Subtle | `240 40% 5%` | Card backgrounds |
| Card | `240 40% 5%` | Card surface |
| Muted | `240 25% 10%` | Disabled, placeholders |
| Border | `240 20% 12%` | Borders, dividers |

### Text Palette

| Token | HSL | Usage |
|-------|-----|-------|
| Foreground | `0 0% 96%` | Primary text |
| Muted-foreground | `215 20% 50%` | Secondary text |
| White/40 | — | Labels, descriptions |
| White/60 | — | Subdued text |
| White/80 | — | Emphasized text |

### Status Colors

| Token | HSL | Usage |
|-------|-----|-------|
| Success | `119 99% 46%` | Green — same as primary |
| Warning | `38 92% 50%` | Amber — caution states |
| Destructive | `0 62% 50%` | Red — errors, deletes |
| Info | `199 89% 48%` | Blue — informational |

---

## Typography

- **Primary font**: Sora (weights 300–700)
- **CSS variable**: `--font-sans: 'Sora', ...`
- **Utility class**: `.font-sora`
- **Monospace**: JetBrains Mono (code blocks, API keys)

---

## Component Patterns

### Glass Card (default for all cards)

```html
<div class="rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl">
```

- Hover: `hover:bg-white/[0.04] hover:border-white/[0.1]`
- No light mode — dark only

### Buttons

| Variant | Style |
|---------|-------|
| Default | `bg-primary text-primary-foreground hover:bg-primary/90` |
| Outline | `border border-white/[0.1] bg-transparent hover:bg-white/[0.04]` |
| Ghost | `hover:bg-white/[0.04]` |
| Glow | `bg-primary shadow-glow hover:shadow-glow-lg` |

### Inputs

```html
<input class="bg-white/[0.04] border border-white/[0.08] focus:ring-primary/30 focus:border-primary/50" />
```

### Badges

| Variant | Style |
|---------|-------|
| Default | `bg-primary/15 text-primary` (green) |
| Success | `bg-success/15 text-success` |
| Warning | `bg-warning/15 text-warning` |
| Destructive | `bg-destructive/15 text-destructive` |

### Sidebar

- Background: `bg-background/80 backdrop-blur-xl`
- Active item: `bg-primary/10 text-primary` with green glow left bar
- Inactive: `text-white/40 hover:bg-white/[0.04]`
- Section headers: `text-[10px] uppercase tracking-widest text-white/25`

### TopBar

- Background: `bg-background/60 backdrop-blur-xl border-b border-white/[0.06]`
- Title: Sora font, `text-sm font-semibold text-white`

---

## Animations

### Fade-up (primary entrance animation)

```css
@keyframes fade-up {
  0% { opacity: 0; transform: translateY(20px); filter: blur(4px); }
  100% { opacity: 1; transform: translateY(0); filter: blur(0); }
}
.animate-fade-up { animation: fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }
```

### Stagger pattern

Every page wraps content sections with incrementing `animation-delay`:

```html
<div class="animate-fade-up" style="animation-delay: 0ms">  <!-- heading -->
<div class="animate-fade-up" style="animation-delay: 80ms"> <!-- first section -->
<div class="animate-fade-up" style="animation-delay: 160ms"><!-- second section -->
<div class="animate-fade-up" style="animationDelay: 240ms"> <!-- third section -->
```

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  .animate-fade-up, .animate-fade-in { animation: none !important; }
}
```

---

## Mobile Responsiveness

| Breakpoint | Behavior |
|------------|----------|
| < 768px | No sidebar, hamburger menu, single-column, `p-4` padding |
| 768px–1024px | Collapsible sidebar, 2-column grids |
| > 1024px | Full sidebar, 3–4 column grids, `p-6` padding |

### Grid patterns

- Stat cards: `grid-cols-2 lg:grid-cols-3 xl:grid-cols-6`
- Chart grid: `grid-cols-1 md:grid-cols-2`
- Detail stat cards: `grid-cols-2 md:grid-cols-4`
- Tables: wrap in `overflow-x-auto` on mobile

### Touch targets

- Minimum `44px` height for interactive elements on mobile
- Buttons: `min-h-[44px]`

---

## Email Templates

### Color mapping

| Element | Old (purple) | New (green) |
|---------|-------------|-------------|
| Header gradient | `#6366f1 → #8b5cf6` | `#77FF47 → #22C55E` |
| CTA button | `#6366f1` | `#77FF47` |
| Button text | `#ffffff` | `#0a0f1a` |
| Accent numbers | `#6366f1` | `#77FF47` |
| Card background | `#1e293b` | `#111827` |
| Page background | `#0f172a` | `#0a0f1a` |
| Border | `#334155` | `rgba(255,255,255,0.06)` |
| Muted text | `#64748b` | `#6b7280` |
| Font | system | Sora + system |

### Template subjects

| Template | Subject |
|----------|---------|
| Welcome | Welcome to Niriksh |
| Verify Email | Verify your email - Niriksh |
| Password Reset | Reset your password - Niriksh |
| Invite | You've been invited to join {org} on Niriksh |
| Agent Connected | New agent connected - Niriksh |
| Sync Complete | Historical sync complete - Niriksh |

---

## Rules

1. **Dark-only** — No light mode. No theme toggle.
2. **Green accent** — Primary is always `#77FF47`. No blue, no purple.
3. **Glass cards** — Every card uses `bg-white/[0.03] backdrop-blur-xl border-white/[0.08]`.
4. **Sora font** — All headings and UI text use Sora.
5. **Stagger animations** — Every page entry uses `animate-fade-up` with delays.
6. **Mobile-first** — Every component must work at 375px.
7. **Niriksh branding** — Never AIInsight, never SENTINEL.
8. **No Framer Motion in pages** — Use CSS animations only (Framer Motion only in OnboardingWizard).
9. **No theme toggle** — Remove all `useTheme()` calls from components.
10. **Green glow** — Active states use `shadow-[0_0_8px_rgba(119,255,71,0.5)]`.
