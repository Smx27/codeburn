'use client';

import Link from 'next/link';
import {
  BarChart3,
  PieChart,
  Users,
  TrendingUp,
  LayoutDashboard,
  Shield,
  Download,
  RefreshCw,
  Lightbulb,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';

const features = [
  {
    icon: BarChart3,
    title: 'Usage Analytics',
    description:
      'Comprehensive tracking of AI tool usage across your entire engineering team',
  },
  {
    icon: PieChart,
    title: 'Provider Analytics',
    description:
      'Compare usage and costs across Claude, Codex, Gemini, Cursor, and more',
  },
  {
    icon: Users,
    title: 'Team Insights',
    description:
      'Understand which team members and projects use AI most effectively',
  },
  {
    icon: TrendingUp,
    title: 'Historical Tracking',
    description:
      'Sync months of historical data for trend analysis',
  },
  {
    icon: LayoutDashboard,
    title: 'Organization Dashboards',
    description:
      'Centralized dashboards for organization-wide AI visibility',
  },
  {
    icon: Shield,
    title: 'Governance Ready',
    description:
      'Built for enterprise compliance and governance requirements',
  },
];

const steps = [
  {
    icon: Download,
    title: 'Install Agent',
    description: 'Download and install the CLI agent on your machines',
  },
  {
    icon: RefreshCw,
    title: 'Sync Historical Data',
    description: 'Automatically backfill months of AI usage data',
  },
  {
    icon: Lightbulb,
    title: 'Gain Organization Insights',
    description: 'Real-time analytics across your entire team',
  },
];

const providers = [
  'Claude',
  'Codex',
  'Gemini',
  'Cursor',
  'OpenCode',
  'Warp',
  'Future Providers',
];

const screenshots = [
  { title: 'Dashboard', icon: LayoutDashboard },
  { title: 'Provider Analytics', icon: PieChart },
  { title: 'User Analytics', icon: Users },
  { title: 'Machine Monitoring', icon: BarChart3 },
];

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'For individual developers',
    features: [
      'Basic usage analytics',
      '1 user',
      '5 machines',
      '7-day data retention',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'For growing teams',
    features: [
      'Full usage analytics',
      'Unlimited users',
      'Unlimited machines',
      '90-day data retention',
      'Priority support',
      'Historical sync',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations',
    features: [
      'Everything in Pro',
      'Unlimited data retention',
      'Dedicated support',
      'Custom integrations',
      'SSO & SAML',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="relative">
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
              backgroundSize: '32px 32px',
            }}
          />
        </div>

        <div className="container-wide relative py-24 sm:py-32 lg:py-40">
          <div className="mx-auto max-w-3xl text-center animate-fade-in-up">
            <Badge variant="info" className="mb-6">
              Open Source &middot; Self-hosted
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
              AI Usage Intelligence{' '}
              <span className="text-primary">For Engineering Teams</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Track AI usage across Claude, Codex, Gemini, Cursor, OpenCode and
              more. Understand costs, measure adoption, and govern AI tooling
              across your entire organization.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-md transition-all hover:bg-primary-hover hover:shadow-glow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-muted hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                Book Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────── */}
      <section id="features" className="py-20 sm:py-28">
        <div className="container-wide">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Everything you need to understand AI usage
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive analytics and governance for every AI tool your team
              uses.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="card-interactive border-border/50"
              >
                <CardContent className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-subtle mb-4">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-background-subtle">
        <div className="container-wide">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Up and running in minutes
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to gain complete visibility into your
              organization&apos;s AI usage.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-children">
            {steps.map((step, i) => (
              <div key={step.title} className="relative text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-glow mb-5">
                  <step.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full text-6xl font-bold text-primary/10 select-none">
                  {i + 1}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Supported Providers ───────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="container-wide">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Supported providers
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Track usage across all the AI tools your team already uses.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 max-w-2xl mx-auto">
            {providers.map((provider) => (
              <div
                key={provider}
                className="inline-flex items-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/30"
              >
                {provider === 'Future Providers' ? (
                  <span className="text-muted-foreground">{provider}</span>
                ) : (
                  provider
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Screenshots ───────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-background-subtle">
        <div className="container-wide">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              See it in action
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful dashboards that give you complete visibility.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
            {screenshots.map((shot) => (
              <Card key={shot.title} className="border-border/50 overflow-hidden">
                <div className="aspect-[4/3] flex items-center justify-center bg-muted/50">
                  <shot.icon className="h-12 w-12 text-muted-foreground/40" />
                </div>
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-foreground text-center">
                    {shot.title}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────── */}
      <section id="pricing" className="py-20 sm:py-28">
        <div className="container-wide">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free, scale as you grow.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto stagger-children">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative flex flex-col ${
                  plan.highlighted
                    ? 'border-primary shadow-glow ring-1 ring-primary/20'
                    : 'border-border/50'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="info">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-6 flex flex-col flex-1">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-foreground">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {plan.description}
                    </p>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-sm text-muted-foreground">
                          {plan.period}
                        </span>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                        <span className="text-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.name === 'Enterprise' ? '/docs' : '/register'}
                    className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                      plan.highlighted
                        ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover hover:shadow-glow'
                        : 'border border-border bg-card text-foreground hover:bg-muted hover:shadow-sm'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                  <Badge
                    variant="warning"
                    className="mt-3 justify-center"
                  >
                    Coming Soon
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-background-subtle">
        <div className="container-wide text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Ready to understand your AI usage?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Get started for free. No credit card required.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-md transition-all hover:bg-primary-hover hover:shadow-glow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Start Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-muted hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Read the Docs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
