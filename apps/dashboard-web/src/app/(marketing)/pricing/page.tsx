'use client';

import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'For individual developers exploring AI usage tracking.',
    features: [
      'Basic usage analytics',
      '1 user',
      '5 machines',
      '7-day data retention',
      'Community support',
      'Single provider tracking',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'For teams that need full visibility into AI usage.',
    features: [
      'Full usage analytics',
      'Unlimited users',
      'Unlimited machines',
      '90-day data retention',
      'Priority support',
      'Historical data sync',
      'Multi-provider tracking',
      'Team insights',
      'Cost breakdowns',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations with advanced requirements.',
    features: [
      'Everything in Pro',
      'Unlimited data retention',
      'Dedicated support engineer',
      'Custom integrations',
      'SSO & SAML',
      'SLA guarantee',
      'On-premise deployment',
      'Audit logs',
      'Custom dashboards',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

const faqs = [
  {
    q: 'Can I try Pro for free?',
    a: 'Yes. All paid plans include a 14-day free trial with no credit card required.',
  },
  {
    q: 'What AI providers do you support?',
    a: 'We currently support Claude, Codex, Gemini, Cursor, OpenCode, and Warp. More providers are added regularly.',
  },
  {
    q: 'How does historical data sync work?',
    a: 'Our CLI agent can backfill up to 6 months of historical usage data from supported providers.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. We use end-to-end encryption and SOC 2 compliant infrastructure. Your code never leaves your machines.',
  },
];

export default function PricingPage() {
  return (
    <div className="relative">
      {/* ── Header ────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="container-wide relative text-center">
          <Badge variant="info" className="mb-6">
            Simple Pricing
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Plans for every team size
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free and scale as your team grows. All plans include core
            features.
          </p>
        </div>
      </section>

      {/* ── Plans ─────────────────────────────────────────── */}
      <section className="pb-20 sm:pb-28">
        <div className="container-wide">
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
                    {plan.highlighted && (
                      <ArrowRight className="ml-2 h-4 w-4" />
                    )}
                  </Link>
                  <Badge variant="warning" className="mt-3 justify-center">
                    Coming Soon
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-background-subtle">
        <div className="container-narrow">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <Card key={faq.q} className="border-border/50">
                <CardContent className="p-6">
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {faq.q}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="container-wide text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Start tracking your AI usage in minutes. No credit card required.
          </p>
          <div className="mt-8">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-md transition-all hover:bg-primary-hover hover:shadow-glow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Start Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
