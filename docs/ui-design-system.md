# AiInsight Cloud UI Design System

## Design Philosophy

The AiInsight Cloud dashboard follows a **data-first approach** designed for fast scannability. Every visual decision prioritizes information density and clarity over decoration.

### Core Principles

- **Data-first**: Metrics, charts, and tables are the primary focus. UI chrome is minimized.
- **Fast scannability**: Key metrics are visible at a glance. Information hierarchy guides the eye from summary to detail.
- **Executive-friendly**: High-level cost summaries and trends are immediately accessible without technical knowledge.
- **Engineering-friendly**: Detailed breakdowns by model, provider, and session are available on demand.
- **Minimal visual noise**: No gratuitous animations, gradients, or decorative elements. Every pixel serves a purpose.
- **Excellent information hierarchy**: Primary metrics are large and bold. Secondary data is smaller and muted. Tertiary details appear on hover or drill-down.

---

## Color System

### Primary Palette

Indigo-based primary color used for interactive elements, active states, and brand identity.

```css
--primary: 234 86% 62%;           /* Main indigo */
--primary-hover: 234 86% 57%;     /* Darker on hover */
--primary-foreground: 0 0% 100%;  /* White text on primary */
--primary-subtle: 234 86% 96%;    /* Light indigo background */
--primary-muted: 234 86% 92%;     /* Muted indigo background */
```

### Chart Colors

Seven distinct colors for data visualization, designed for accessibility and contrast.

```css
--chart-1: 234 86% 62%;   /* Indigo (primary) */
--chart-2: 142 71% 45%;   /* Green */
--chart-3: 38 92% 50%;    /* Amber */
--chart-4: 330 81% 60%;   /* Pink */
--chart-5: 199 89% 48%;   /* Cyan */
--chart-6: 280 66% 56%;   /* Purple */
--chart-7: 16 80% 55%;    /* Orange */
```

### Status Colors

Semantic colors for status indicators and feedback.

| Status | Color | Use Case |
|--------|-------|----------|
| Success | `142 71% 45%` (green) | Positive trends, completed actions |
| Warning | `38 92% 50%` (amber) | Caution states, approaching limits |
| Info | `199 89% 48%` (blue) | Informational messages, neutral states |
| Destructive | `0 84% 60%` (red) | Errors, negative trends, deletion |

### Provider Colors

Unique colors for each AI coding provider to enable quick visual identification.

| Provider | Color | CSS Value |
|----------|-------|-----------|
| Claude | Purple | `280 66% 56%` |
| Codex | Blue | `234 86% 62%` |
| Cursor | Green | `142 71% 45%` |
| Gemini | Amber | `38 92% 50%` |
| Warp | Cyan | `199 89% 48%` |
| OpenCode | Red | `0 84% 60%` |

### Dark Mode

Dark mode uses deep navy backgrounds (not pure black) for reduced eye strain and better contrast.

```css
/* Light mode */
--background: 220 20% 99%;
--card: 0 0% 100%;

/* Dark mode */
--background: 222 47% 6%;    /* Deep navy */
--card: 222 40% 8%;          /* Slightly lighter navy */
```

All components use CSS variables for automatic theme support. No separate dark mode components are needed.

---

## Typography

### Font Families

- **Sans-serif**: Inter (Google Fonts) - Primary UI font
- **Monospace**: JetBrains Mono - Code, data values, technical information

```css
--font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace;
```

### Type Scale

| Token | Size | Use Case |
|-------|------|----------|
| `--text-xs` | 0.75rem (12px) | Labels, captions |
| `--text-sm` | 0.8125rem (13px) | Secondary text |
| `--text-base` | 0.875rem (14px) | Body text (default) |
| `--text-lg` | 1rem (16px) | Card values |
| `--text-xl` | 1.125rem (18px) | Section headers |
| `--text-2xl` | 1.25rem (20px) | Metric values |
| `--text-3xl` | 1.5rem (24px) | Hero metrics |

---

## Spacing & Layout

### Layout Dimensions

| Element | Size | Notes |
|---------|------|-------|
| Sidebar (expanded) | 240px | Full navigation with labels |
| Sidebar (collapsed) | 64px | Icons only |
| TopBar | 56px | Fixed height |
| Content area | Flexible | `p-6` padding (24px) |
| Card gap | `gap-4` to `gap-6` | 16px to 24px between cards |

### Spacing Scale

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### Border Radius

```css
--radius: 0.625rem;   /* 10px - Global radius */
```

### Elevation (Shadows)

```css
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.03);
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.06), 0 4px 6px -4px rgb(0 0 0 / 0.06);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.07), 0 8px 10px -6px rgb(0 0 0 / 0.07);
```

---

## Components

### MetricCard

Displays a key metric with icon, value, trend indicator, and optional sparkline.

```tsx
<MetricCard
  title="Total Cost"
  value="$1,234.56"
  icon={DollarSign}
  trend={{ value: 12.5, isPositive: true }}
  sparklineData={[10, 15, 12, 18, 22, 25, 28]}
  iconColor="hsl(var(--primary))"
/>
```

**Props:**
- `title`: Metric label
- `value`: Formatted metric value
- `icon`: Lucide icon component
- `trend`: `{ value: number, isPositive: boolean }` - Percentage change
- `sparklineData`: `number[]` - Mini chart data
- `iconColor`: CSS color for icon background
- `className`: Additional CSS classes

### InsightCard

Compact card for displaying insights or secondary metrics.

```tsx
<InsightCard
  title="Cache Hit Rate"
  value="87.5%"
  subtitle="Above target"
  icon={Database}
  iconColor="hsl(var(--success))"
/>
```

**Props:**
- `title`: Insight label
- `value`: Formatted value
- `subtitle`: Optional description
- `icon`: Lucide icon component
- `iconColor`: CSS color for icon background

### Badge

Status or category indicator with multiple variants.

```tsx
<Badge variant="success">Healthy</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="provider">Claude</Badge>
```

**Variants:**
| Variant | Background | Text | Use Case |
|---------|------------|------|----------|
| `default` | Muted | Muted foreground | Neutral labels |
| `success` | Success subtle | Success | Positive status |
| `warning` | Warning subtle | Warning | Caution states |
| `error` | Destructive subtle | Destructive | Error states |
| `info` | Info subtle | Info | Informational |
| `provider` | Primary subtle | Primary | Provider names |

### Skeleton

Loading state with shimmer animation.

```tsx
<Skeleton className="h-4 w-[200px]" />
```

### DataTable

Sortable, paginated table component.

```tsx
<DataTable
  columns={[
    { key: 'name', header: 'Name', sortable: true },
    { key: 'cost', header: 'Cost', sortable: true, render: (item) => `$${item.cost}` },
  ]}
  data={rows}
  sortKey="cost"
  sortDirection="desc"
  onSort={handleSort}
  pageSize={10}
  currentPage={1}
  onPageChange={setPage}
  totalItems={100}
/>
```

**Features:**
- Column sorting with visual indicators
- Pagination with page numbers
- Loading skeleton state
- Empty state with icon and message
- Row click handlers

### EmptyState

Helpful empty state messages when no data is available.

```tsx
<EmptyState
  icon={Inbox}
  title="No data yet"
  description="Start using AiInsight to see analytics here."
/>
```

### Card Variants

Three card surface styles for different content hierarchy.

```css
.card-base        /* Default card with subtle shadow */
.card-elevated    /* Raised card for emphasis */
.card-interactive /* Clickable card with hover effects */
```

---

## Chart Library

All charts are built with Recharts and follow consistent styling patterns.

### AreaChart

Gradient-filled area charts for time-series data.

```tsx
<AreaChart
  data={dailyData}
  series={[
    { key: 'cost', name: 'Cost', color: 'hsl(var(--chart-1))', gradient: true },
    { key: 'tokens', name: 'Tokens', color: 'hsl(var(--chart-2))', gradient: true },
  ]}
  xKey="date"
  height={300}
  stacked={false}
/>
```

### BarChart

Rounded bar charts for categorical comparisons.

```tsx
<BarChart
  data={modelData}
  series={[
    { key: 'inputTokens', name: 'Input Tokens', color: 'hsl(var(--chart-1))' },
    { key: 'outputTokens', name: 'Output Tokens', color: 'hsl(var(--chart-2))' },
  ]}
  stacked={true}
  horizontal={false}
  barRadius={[4, 4, 0, 0]}
/>
```

### DonutChart

Inner radius donut with center text and interactive hover.

```tsx
<DonutChart
  data={[
    { name: 'Claude', value: 4500, color: 'hsl(var(--chart-1))' },
    { name: 'Codex', value: 3200, color: 'hsl(var(--chart-2))' },
  ]}
  centerLabel="Total"
  centerValue="$7,700"
  innerRadius={60}
  outerRadius={90}
/>
```

### LineChart

Multi-series line charts for trend visualization.

```tsx
<LineChart
  data={trendData}
  series={[
    { key: 'claude', name: 'Claude', color: 'hsl(280 66% 56%)' },
    { key: 'codex', name: 'Codex', color: 'hsl(234 86% 62%)' },
  ]}
  xKey="date"
  height={300}
/>
```

### StackedBarChart

Stacked bar segments with totals for composition analysis.

```tsx
<StackedBarChart
  data={categoryData}
  series={[
    { key: 'coding', name: 'Coding', color: 'hsl(var(--chart-1))' },
    { key: 'debugging', name: 'Debugging', color: 'hsl(var(--chart-2))' },
  ]}
  xKey="date"
  showTotal={true}
/>
```

### HeatmapChart

GitHub-style contribution grid for activity visualization.

```tsx
<HeatmapChart
  data={activityData}
  xKey="day"
  yKey="hour"
  valueKey="sessions"
  colorScale={['hsl(var(--muted))', 'hsl(var(--primary))']}
/>
```

### SparkLine

Tiny inline charts for sparkline data in tables and cards.

```tsx
<SparkLine data={[10, 15, 12, 18, 22]} color="hsl(var(--primary))" />
```

### ChartTooltip

Shared tooltip component for consistent hover information.

```tsx
<ChartTooltip formatValue={(value, key) => `$${value.toFixed(2)}`} />
```

---

## Dark Mode

### Theme Provider

The `ThemeProvider` context manages theme state with localStorage persistence.

```tsx
import { ThemeProvider, useTheme } from '@/lib/theme-context';

// Wrap app in provider
<ThemeProvider>
  <App />
</ThemeProvider>

// Use in components
function ThemeToggle() {
  const { theme, resolved, setTheme, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>Toggle Theme</button>;
}
```

### Features

- **Three modes**: `light`, `dark`, `system`
- **localStorage persistence**: Theme preference saved across sessions
- **System preference detection**: Automatically follows OS theme when set to `system`
- **Toggle in sidebar**: Quick access theme switcher
- **CSS variables**: All components use CSS variables for automatic theme support

### Implementation

```tsx
// Theme context provides:
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  resolved: 'light' | 'dark';  // Actual applied theme
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}
```

---

## Dashboard Pages

### Overview (`/`)

**Purpose**: High-level summary of all AI coding costs and usage.

**Layout:**
- Hero metrics row: Total Cost, Total Sessions, Avg Cost/Session, Cache Hit Rate
- Cost trend chart (AreaChart)
- Provider breakdown (DonutChart)
- Recent activity feed
- Top insights cards

### Providers (`/providers`)

**Purpose**: Deep dive into individual provider performance and costs.

**Layout:**
- Provider health cards (status indicators)
- Cost trends per provider (LineChart)
- Model distribution (BarChart)
- Provider comparison table

### Users (`/users`)

**Purpose**: Team usage analytics and leaderboards.

**Layout:**
- User leaderboard (DataTable, sorted by cost)
- Activity heatmap (HeatmapChart)
- User trends chart (LineChart)
- Per-user model breakdown

### Projects (`/projects`)

**Purpose**: Project-level cost attribution and ranking.

**Layout:**
- Project ranking (DataTable)
- Cost trends per project (LineChart)
- Activity timeline
- Project-to-provider mapping

### Models (`/models`)

**Purpose**: Model-level cost and performance analysis.

**Layout:**
- Model distribution (DonutChart)
- Model leaderboard (DataTable)
- Provider badges (which models from which providers)
- Cost per model trends (BarChart)

### Trends (`/trends`)

**Purpose**: Long-term usage patterns and forecasting.

**Layout:**
- Multi-series charts (LineChart, AreaChart)
- Granularity toggle (daily/weekly/monthly)
- Trend indicators
- Forecast projections

### Settings (`/settings`)

**Purpose**: Dashboard configuration and account management.

**Layout:**
- Appearance settings (theme toggle)
- Organization details
- API key management
- User preferences

---

## Animations & Transitions

### Timing Functions

```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-spring: 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Keyframe Animations

| Animation | Duration | Use Case |
|-----------|----------|----------|
| `fade-in` | 200ms | Initial page load |
| `fade-in-up` | 300ms | Card entry |
| `slide-up` | 300ms | Modal/dialog entry |
| `shimmer` | 1.5s | Skeleton loading |
| `pulse-glow` | 2s | Attention indicators |
| `scale-in` | 200ms | Dropdown/popover entry |

### Stagger Children

Cards and list items use staggered animations for visual hierarchy.

```css
.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 50ms; }
.stagger-children > *:nth-child(3) { animation-delay: 100ms; }
/* ... up to 8 children */
```

---

## Utilities

### Scrollbar Styles

```css
.scrollbar-thin    /* Thin custom scrollbar */
.scrollbar-none    /* Hidden scrollbar */
```

### Container Presets

```css
.container-dashboard  /* Max-width 1280px, responsive padding */
.container-narrow     /* Max-width 768px, for forms */
.container-wide       /* Max-width 1536px, for data-heavy pages */
```

### Focus Ring

All interactive elements have a visible focus ring for accessibility.

```css
*:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px hsl(var(--ring)), 0 0 0 4px hsl(var(--background));
}
```

---

*Document generated: 2026-06-13*
*AiInsight Cloud Dashboard Design System*
