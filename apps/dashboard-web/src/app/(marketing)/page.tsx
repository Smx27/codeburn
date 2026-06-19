'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
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
  Zap,
  Lock,
  Eye,
  Terminal,
  ChevronDown,
  Github,
  Sparkles,
  Activity,
  Clock,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useState } from 'react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const features = [
  {
    icon: Activity,
    title: 'Historical Sync',
    description: 'Backfill months of AI usage data for comprehensive trend analysis from day one.',
  },
  {
    icon: BarChart3,
    title: 'Session Analytics',
    description: 'Deep dive into every AI session with token usage, cost breakdowns, and timeline views.',
  },
  {
    icon: PieChart,
    title: 'Provider Insights',
    description: 'Compare usage and costs across Claude, Codex, Gemini, Cursor, OpenCode, and more.',
  },
  {
    icon: Cpu,
    title: 'Machine Metrics',
    description: 'Track which machines and environments are driving your AI usage and costs.',
  },
  {
    icon: Users,
    title: 'Team Usage',
    description: 'Understand which team members and projects use AI most effectively.',
  },
  {
    icon: Lock,
    title: 'API Keys',
    description: 'Secure API key management with rotation, expiration, and fine-grained permissions.',
  },
  {
    icon: TrendingUp,
    title: 'Trend Charts',
    description: 'Visualize usage trends over time with daily, weekly, and monthly granularity.',
  },
  {
    icon: Shield,
    title: 'No Prompt Storage',
    description: 'We never store your prompts or responses. Only metadata and metrics for analytics.',
  },
];

const steps = [
  {
    icon: Download,
    title: 'Install Agent',
    description: 'One-line install on your machine. Supports macOS, Linux, and Windows.',
    command: 'curl -fsSL https://aiinsight.dev/install.sh | sh',
  },
  {
    icon: Terminal,
    title: 'Configure & Run',
    description: 'Add your API key and start syncing. Takes less than 2 minutes.',
    command: 'aiinsight sync --api-key YOUR_KEY',
  },
  {
    icon: RefreshCw,
    title: 'Historical Sync',
    description: 'Automatically backfill months of AI usage data from your local logs.',
    command: 'aiinsight sync --backfill 90d',
  },
  {
    icon: LayoutDashboard,
    title: 'View Dashboard',
    description: 'Real-time analytics across your entire team in one beautiful dashboard.',
    command: 'open https://app.aiinsight.dev',
  },
];

const providers = [
  { name: 'Claude', icon: Sparkles },
  { name: 'Codex', icon: Zap },
  { name: 'Gemini', icon: Globe },
  { name: 'Cursor', icon: Terminal },
  { name: 'OpenCode', icon: Activity },
  { name: 'Warp', icon: Zap },
  { name: 'More Soon', icon: Plus },
];

function Plus() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function Cpu() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  );
}

const testimonials = [
  {
    quote: "AIInsight gave us complete visibility into our AI spending. We reduced costs by 40% in the first month.",
    author: "Engineering Lead",
    company: "Series B Startup",
  },
  {
    quote: "Finally, a tool that tracks AI usage across all our providers. The historical sync feature is incredible.",
    author: "VP of Engineering",
    company: "Enterprise Team",
  },
  {
    quote: "We went from zero visibility to full governance in under an hour. The onboarding was seamless.",
    author: "DevOps Engineer",
    company: "Growing Team",
  },
];

const faqs = [
  {
    question: 'How does the agent work?',
    answer: 'The agent runs as a background service on your machine, reading local AI tool logs (Claude, Codex, etc.) and syncing metadata to the cloud. We never store your prompts or responses — only usage metrics like token counts, costs, and timestamps.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes. All data is encrypted in transit and at rest. We use industry-standard security practices and never store prompt content. API keys are stored with bcrypt hashing. We support SOC 2 compliance requirements.',
  },
  {
    question: 'What AI tools do you support?',
    answer: 'We currently support Claude (Anthropic), Codex (OpenAI), Gemini (Google), Cursor, OpenCode, and Warp. We\'re adding support for new providers regularly based on community feedback.',
  },
  {
    question: 'Can I self-host?',
    answer: 'Yes! AIInsight is open source and can be self-hosted. We provide Docker images and Helm charts for easy deployment. The cloud version offers managed infrastructure with automatic updates.',
  },
  {
    question: 'How does pricing work?',
    answer: 'We offer a generous free tier for individual developers. Team and Enterprise plans are priced per-seat with unlimited machine connections. All plans include core analytics features.',
  },
  {
    question: 'What if I need to sync historical data?',
    answer: 'Our historical sync feature can backfill up to 1 year of usage data from your local logs. The sync runs in the background and typically completes within a few hours depending on data volume.',
  },
];

export default function LandingPage() {
  const [copiedCommand, setCopiedCommand] = useState(false);

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  return (
    <div className="relative">
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute top-1/2 -left-40 h-[400px] w-[400px] rounded-full bg-primary/3 blur-3xl" />
          <div className="absolute inset-0 bg-grid opacity-[0.02]" />
        </div>

        <div className="container-marketing relative py-24 sm:py-32 lg:py-40">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="mx-auto max-w-4xl text-center"
          >
            <motion.div variants={fadeInUp}>
              <Badge variant="info" className="mb-6 px-4 py-1.5">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Open Source &middot; Self-hosted Available
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]"
            >
              AI Usage Intelligence
              <br />
              <span className="text-gradient">For Engineering Teams</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto"
            >
              Track AI usage across Claude, Codex, Gemini, Cursor, OpenCode and
              more. Understand costs, measure adoption, and govern AI tooling
              across your entire organization.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button size="xl" asChild>
                <Link href="/register">
                  Start Free
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link href="/docs">Book Demo</Link>
              </Button>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-success" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-success" />
                Free tier available
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-success" />
                Open source
              </span>
            </motion.div>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 mx-auto max-w-5xl"
          >
            <div className="relative rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-card/80">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-destructive/60" />
                  <div className="h-3 w-3 rounded-full bg-warning/60" />
                  <div className="h-3 w-3 rounded-full bg-success/60" />
                </div>
                <div className="flex-1 text-center text-xs text-muted-foreground font-mono">
                  app.aiinsight.dev/dashboard
                </div>
              </div>
              <div className="aspect-[16/9] bg-gradient-to-br from-background via-background-subtle to-background flex items-center justify-center">
                <div className="text-center space-y-4 px-8">
                  <div className="grid grid-cols-4 gap-4 max-w-lg mx-auto">
                    {['Sessions', 'Tokens', 'Cost', 'Users'].map((label) => (
                      <div key={label} className="p-4 rounded-lg bg-card/80 border border-border/50">
                        <div className="text-2xl font-bold text-foreground">
                          {label === 'Sessions' ? '12.4K' : label === 'Tokens' ? '89.2M' : label === 'Cost' ? '$2.1K' : '48'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="h-32 rounded-lg bg-card/60 border border-border/30 flex items-end p-4 gap-1">
                    {[45, 62, 38, 71, 55, 80, 42, 68, 50, 75, 35, 58, 44, 70, 52, 65, 40, 73, 48, 60, 56, 67, 43, 58].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-primary/30 rounded-t"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Logo Bar ─────────────────────────────────────── */}
      <section className="py-12 border-y border-border/30 bg-background-subtle/30">
        <div className="container-marketing">
          <p className="text-center text-sm text-muted-foreground mb-8">
            Trusted by engineering teams at
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-40">
            {['Acme Corp', 'TechFlow', 'DataStack', 'CloudBase', 'DevOps Pro'].map((name) => (
              <div key={name} className="text-lg font-bold text-foreground/50">
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────── */}
      <section id="features" className="section-padding">
        <div className="container-marketing">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp}>
              <Badge variant="secondary" className="mb-4">Features</Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold tracking-tight"
            >
              Everything you need to understand
              <br />
              <span className="text-gradient">AI usage across your team</span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Comprehensive analytics and governance for every AI tool your team
              uses, from individual developers to entire organizations.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {features.map((feature) => (
              <motion.div key={feature.title} variants={fadeInUp}>
                <Card className="glass-card h-full border-border/30 hover:border-primary/20 group">
                  <CardContent className="p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-subtle mb-4 group-hover:bg-primary/10 transition-colors">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Provider Support ─────────────────────────────── */}
      <section className="section-padding bg-background-subtle/30">
        <div className="container-marketing">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-12"
          >
            <motion.div variants={fadeInUp}>
              <Badge variant="secondary" className="mb-4">Providers</Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold tracking-tight"
            >
              All your AI tools,{' '}
              <span className="text-gradient">one dashboard</span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Track usage across all the AI tools your team already uses.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto"
          >
            {providers.map((provider) => (
              <motion.div key={provider.name} variants={fadeInUp}>
                <div className="glass-card flex items-center gap-3 px-6 py-4 border-border/30 hover:border-primary/20 transition-all cursor-default">
                  <provider.icon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {provider.name}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────── */}
      <section id="how-it-works" className="section-padding">
        <div className="container-marketing">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp}>
              <Badge variant="secondary" className="mb-4">How It Works</Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold tracking-tight"
            >
              Up and running in{' '}
              <span className="text-gradient">minutes</span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Four simple steps to gain complete visibility into your
              organization&apos;s AI usage.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {steps.map((step, i) => (
              <motion.div key={step.title} variants={fadeInUp}>
                <div className="relative">
                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-[calc(50%+40px)] right-[-40px] h-[2px] bg-gradient-to-r from-primary/30 to-primary/10" />
                  )}

                  <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-5 relative">
                      <step.icon className="h-7 w-7 text-primary" />
                      <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {i + 1}
                      </div>
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {step.description}
                    </p>
                    <div className="relative group">
                      <code className="block text-xs font-mono text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 border border-border/50">
                        {step.command}
                      </code>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Screenshots ───────────────────────────────────── */}
      <section className="section-padding bg-background-subtle/30">
        <div className="container-marketing">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-14"
          >
            <motion.div variants={fadeInUp}>
              <Badge variant="secondary" className="mb-4">Dashboard</Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold tracking-tight"
            >
              See it in action
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Powerful dashboards that give you complete visibility into AI usage.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            {[
              { title: 'Overview Dashboard', icon: LayoutDashboard, desc: 'Real-time metrics at a glance' },
              { title: 'Provider Analytics', icon: PieChart, desc: 'Compare costs across providers' },
              { title: 'User Analytics', icon: Users, desc: 'Track team adoption and usage' },
              { title: 'Trend Analysis', icon: TrendingUp, desc: 'Visualize usage over time' },
            ].map((shot) => (
              <motion.div key={shot.title} variants={fadeInUp}>
                <Card className="glass-card overflow-hidden border-border/30 group">
                  <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid opacity-[0.03]" />
                    <div className="text-center space-y-3 relative">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mx-auto group-hover:scale-110 transition-transform">
                        <shot.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{shot.title}</p>
                        <p className="text-xs text-muted-foreground">{shot.desc}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────── */}
      <section className="section-padding">
        <div className="container-marketing">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-14"
          >
            <motion.div variants={fadeInUp}>
              <Badge variant="secondary" className="mb-4">Testimonials</Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold tracking-tight"
            >
              Loved by{' '}
              <span className="text-gradient">engineering teams</span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {testimonials.map((t, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <Card className="glass-card h-full border-border/30">
                  <CardContent className="p-6">
                    <div className="flex mb-3">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <svg key={j} className="h-4 w-4 text-warning fill-warning" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-sm text-foreground leading-relaxed mb-4">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.author}</p>
                      <p className="text-xs text-muted-foreground">{t.company}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────── */}
      <section id="pricing" className="section-padding bg-background-subtle/30">
        <div className="container-marketing">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-14"
          >
            <motion.div variants={fadeInUp}>
              <Badge variant="secondary" className="mb-4">Pricing</Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold tracking-tight"
            >
              Simple, transparent{' '}
              <span className="text-gradient">pricing</span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Start free, scale as you grow. No credit card required.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {[
              {
                name: 'Free Beta',
                price: '$0',
                period: '/month',
                description: 'For individual developers',
                features: [
                  'Basic usage analytics',
                  '1 user',
                  '5 machines',
                  '7-day data retention',
                  'Community support',
                ],
                cta: 'Get Started',
                highlighted: false,
              },
              {
                name: 'Team',
                price: '$19',
                period: '/user/month',
                description: 'For growing teams',
                features: [
                  'Full usage analytics',
                  'Unlimited users',
                  'Unlimited machines',
                  '90-day data retention',
                  'Historical sync',
                  'Priority support',
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
                  'Everything in Team',
                  'Unlimited data retention',
                  'SSO & SAML',
                  'Custom integrations',
                  'Dedicated support',
                  'SLA guarantee',
                ],
                cta: 'Contact Sales',
                highlighted: false,
              },
            ].map((plan) => (
              <motion.div key={plan.name} variants={fadeInUp}>
                <Card
                  className={`relative flex flex-col h-full ${
                    plan.highlighted
                      ? 'border-primary/50 shadow-glow ring-1 ring-primary/20'
                      : 'border-border/30 glass-card'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="default" className="px-3">Most Popular</Badge>
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
                        <span className="text-4xl font-bold text-foreground">
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
                    <Button
                      variant={plan.highlighted ? 'default' : 'outline'}
                      className="w-full"
                      asChild
                    >
                      <Link href={plan.name === 'Enterprise' ? '/contact' : '/register'}>
                        {plan.cta}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            <Lock className="inline h-3.5 w-3.5 mr-1" />
            We never store your prompts or responses. Only usage metadata for analytics.
          </p>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section className="section-padding">
        <div className="container-narrow">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-14"
          >
            <motion.div variants={fadeInUp}>
              <Badge variant="secondary" className="mb-4">FAQ</Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold tracking-tight"
            >
              Frequently asked questions
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="glass-card border-border/30 px-4"
                >
                  <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="section-padding bg-background-subtle/30">
        <div className="container-marketing text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold tracking-tight"
            >
              Ready to understand your AI usage?
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto"
            >
              Get started for free. No credit card required. Set up in minutes.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button size="xl" asChild>
                <Link href="/register">
                  Start Free
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link href="/docs">Read the Docs</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
