---
name: niriksh-design
description: "Enforce the Niriksh dark/green design system across all UI surfaces — dashboard-web, emails, future apps"
---

<objective>
Apply the Niriksh design system consistently to any new or modified UI code. This skill ensures every component, page, email template, and layout follows the same dark/green aesthetic with glass cards, Sora font, staggered animations, and mobile-first responsiveness.

Use this skill when:
- Building new pages or components in dashboard-web
- Modifying existing UI components
- Creating or updating email templates
- Reviewing PRs for design consistency
- Onboarding new contributors to the design system
</objective>

<design_reference>
@/home/priya/Documents/Github/Ai/aiinsight/DESIGN.md
</design_reference>

<process>

## Step 1: Load Design System

Read `DESIGN.md` at the project root. This is the single source of truth.

## Step 2: Audit Current State

Before making changes, check:
1. Are there any blue (`blue-500`, `blue-400`) accent colors? → Replace with `primary`
2. Is there a theme toggle or `useTheme()`? → Remove it
3. Are cards using solid backgrounds? → Switch to glass pattern
4. Is the font Sora? → Verify `font-sora` class or CSS variable
5. Are animations present? → Add `animate-fade-up` with stagger delays
6. Is it mobile-responsive? → Check grid breakpoints

## Step 3: Apply Design Rules

### For new components:
```tsx
// Card pattern
<Card className="border-white/[0.06] bg-white/[0.02] backdrop-blur-xl animate-fade-up"
      style={{ animationDelay: '0ms' }}>
  <CardContent className="p-5">
    {/* content */}
  </CardContent>
</Card>

// Button pattern
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">

// Input pattern
<Input className="bg-white/[0.04] border-white/[0.08] focus:ring-primary/30 focus:border-primary/50" />

// Badge pattern
<Badge variant="default"> {/* green */}
<Badge variant="success"> {/* green */}
<Badge variant="destructive"> {/* red */}

// Active nav item
<Link className="bg-primary/10 text-primary shadow-[inset_0_0_20px_rgba(119,255,71,0.05)]">
  <div className="absolute left-0 w-[3px] h-4 rounded-r-full bg-primary shadow-[0_0_8px_rgba(119,255,71,0.5)]" />
```

### For page layouts:
```tsx
// Page wrapper
<div className="space-y-8">
  {/* Header — delay 0ms */}
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-up">
    <h1 className="text-3xl font-bold tracking-tight text-white font-sora">Page Title</h1>
    <PeriodSelector />
  </div>

  {/* Content sections — incrementing delays */}
  <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
    {items.map((item, i) => (
      <Card key={i} className="animate-fade-up" style={{ animationDelay: `${80 + i * 80}ms` }}>
        {/* card content */}
      </Card>
    ))}
  </div>
</div>
```

### For email templates:
- Header gradient: `background:linear-gradient(135deg,#77FF47,#22C55E)`
- CTA button: `background-color:#77FF47;color:#0a0f1a`
- Card bg: `#111827` with `border:1px solid rgba(255,255,255,0.06)`
- Page bg: `#0a0f1a`
- Font: `font-family:'Sora',-apple-system,BlinkMacSystemFont,...`
- Footer: `Niriksh — AI Token Usage Intelligence`

## Step 4: Verify

After changes:
1. `npm run dashboard-web:build` — must pass
2. `npm run dashboard-api:build` — must pass (if email changes)
3. Grep for `blue-[45]00` — should find 0 results (except provider-specific avatar colors)
4. Grep for `AIInsight` — must find 0 results
5. Grep for `SENTINEL` — must find 0 results
6. Check `useTheme` imports — only in theme-context.tsx (no consumer usage)

</process>

<rules>

1. **NEVER** use blue (`blue-500`, `blue-400`, `cyan-400`) as accent colors
2. **NEVER** add a theme toggle or light mode
3. **NEVER** use solid card backgrounds without `backdrop-blur-xl`
4. **NEVER** skip `animate-fade-up` on page sections
5. **NEVER** use Framer Motion in page components (only OnboardingWizard)
6. **ALWAYS** use Sora font for headings and UI text
7. **ALWAYS** add stagger delays to animated sections
8. **ALWAYS** test mobile at 375px minimum
9. **ALWAYS** use "Niriksh" branding, never "AIInsight"
10. **ALWAYS** read DESIGN.md before making UI changes

</rules>
