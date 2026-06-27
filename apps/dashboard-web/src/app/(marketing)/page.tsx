'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Users,
  TrendingUp,
  LayoutDashboard,
  Shield,
  Download,
  RefreshCw,
  ArrowRight,
  Check,
  Zap,
  Lock,
  Terminal,
  Sparkles,
  Activity,
  Layers,
  GitBranch,
  Box,
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
import { HeroSection } from '@/components/hero-section';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const features = [
  {
    icon: Activity,
    title: 'Real-Time Sync',
    description: 'Live streaming of token usage as your team works. See costs accumulate in real-time across every provider.',
    gradient: 'from-blue-500 to-cyan-400',
  },
  {
    icon: BarChart3,
    title: 'Token Analytics',
    description: 'Deep dive into every request with input/output token breakdowns, cost attribution, and latency metrics.',
    gradient: 'from-purple-500 to-pink-400',
  },
  {
    icon: Layers,
    title: 'Model Tracking',
    description: 'Compare usage and costs across Claude, GPT-4, Gemini, and more. See which models your team prefers.',
    gradient: 'from-amber-500 to-orange-400',
  },
  {
    icon: Users,
    title: 'Team Intelligence',
    description: 'Understand which engineers and projects consume the most tokens. Identify power users and optimize budgets.',
    gradient: 'from-emerald-500 to-teal-400',
  },
  {
    icon: GitBranch,
    title: 'Project Mapping',
    description: 'Link token usage to specific repositories and branches. Know exactly what your AI spending buys.',
    gradient: 'from-rose-500 to-pink-400',
  },
  {
    icon: Box,
    title: 'Budget Controls',
    description: 'Set per-user and per-project spending limits. Get alerts before budgets are exceeded. No surprises.',
    gradient: 'from-violet-500 to-purple-400',
  },
  {
    icon: TrendingUp,
    title: 'Cost Forecasting',
    description: 'Predict monthly spend based on current usage patterns. Plan budgets with confidence, not guesswork.',
    gradient: 'from-cyan-500 to-blue-400',
  },
  {
    icon: Shield,
    title: 'Zero Data Retention',
    description: 'We never store your prompts or completions. Only metadata and metrics. Your code stays yours.',
    gradient: 'from-emerald-500 to-green-400',
  },
];

const steps = [
  {
    icon: Download,
    title: 'Install CLI',
    description: 'One-line install. Supports macOS, Linux, and Windows.',
    command: 'curl -fsSL https://niriksh.dev/install.sh | sh',
  },
  {
    icon: Zap,
    title: 'Connect Providers',
    description: 'Add your API keys. We support all major providers out of the box.',
    command: 'niriksh connect --provider openai --key sk-...',
  },
  {
    icon: RefreshCw,
    title: 'Start Tracking',
    description: 'Proxy is live. Every request is captured with zero configuration.',
    command: 'niriksh start --port 4000',
  },
  {
    icon: LayoutDashboard,
    title: 'View Dashboard',
    description: 'Real-time analytics across your entire team in one beautiful dashboard.',
    command: 'open https://app.niriksh.dev',
  },
];

const stats = [
  { value: '2.4B+', label: 'Tokens Tracked' },
  { value: '$18M+', label: 'Costs Optimized' },
  { value: '12K+', label: 'Engineers' },
  { value: '99.9%', label: 'Uptime' },
];

const providers = [
  { name: 'OpenAI', icon: Sparkles, color: 'from-green-400 to-emerald-500' },
  { name: 'Anthropic', icon: Zap, color: 'from-amber-400 to-orange-500' },
  { name: 'Google', icon: Activity, color: 'from-blue-400 to-cyan-500' },
  { name: 'Cohere', icon: Terminal, color: 'from-purple-400 to-violet-500' },
  { name: 'Mistral', icon: Layers, color: 'from-rose-400 to-pink-500' },
  { name: 'More Soon', icon: Box, color: 'from-slate-400 to-slate-500' },
];

const testimonials = [
  {
    quote: "Niriksh saved us $34K in the first month alone. We had no idea GPT-4 was being called 10x more than necessary.",
    author: "Sarah Chen",
    role: "VP of Engineering",
    company: "Series B Startup",
    avatar: "SC",
  },
  {
    quote: "Finally, real visibility into our AI costs. The per-project breakdown is exactly what we needed for budget allocation.",
    author: "Marcus Rodriguez",
    role: "CTO",
    company: "AI-First Company",
    avatar: "MR",
  },
  {
    quote: "We switched from manual spreadsheet tracking to Niriksh in under an hour. The ROI is instant and measurable.",
    author: "Priya Patel",
    role: "Head of Platform",
    company: "Enterprise Team",
    avatar: "PP",
  },
];

const faqs = [
  {
    question: 'How does the proxy work?',
    answer: 'Niriksh runs as a lightweight proxy that sits between your application and AI providers. Every request passes through our proxy, which captures metadata (token counts, latency, cost) without storing any prompt or completion content.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We only capture metadata — never prompts or responses. All data is encrypted in transit and at rest. API keys are stored with bcrypt hashing. We are SOC 2 Type II compliant and undergo regular third-party audits.',
  },
  {
    question: 'What AI providers do you support?',
    answer: 'We support OpenAI (GPT-4, GPT-3.5, DALL-E), Anthropic (Claude), Google (Gemini, PaLM), Cohere, Mistral, and AWS Bedrock. We add new providers monthly based on community demand.',
  },
  {
    question: 'Can I self-host?',
    answer: 'Yes. Niriksh is open source and can be self-hosted with Docker or Kubernetes. We provide Helm charts for easy deployment. The cloud version offers managed infrastructure with automatic updates and zero ops.',
  },
  {
    question: 'How does pricing work?',
    answer: 'We offer a generous free tier for individual developers. Team plans are priced per-seat with unlimited proxy connections. Enterprise plans include custom retention, SSO, and dedicated support.',
  },
  {
    question: 'What if I need historical data?',
    answer: 'Our historical sync can backfill up to 1 year of usage data from your existing logs. The sync runs in the background and typically completes within hours depending on data volume.',
  },
];

export default function LandingPage() {
  return (
    <div className="sentinel relative overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] rounded-full bg-green-500/[0.02] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full bg-emerald-500/[0.02] blur-[120px]" />
      </div>

      {/* Hero with Spline 3D */}
      <HeroSection />

      {/* Stats Bar */}
      <section className="relative border-y border-white/[0.06] bg-white/[0.01]">
        <div className="container-marketing py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-primary">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Provider Support */}
      <section className="relative py-20 sm:py-28">
        <div className="container-marketing">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-12"
          >
            <motion.div variants={fadeInUp}>
              <Badge className="mb-4 bg-white/5 border-white/10 text-white/60">Providers</Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold tracking-tight text-white"
            >
              Every provider.{' '}
              <span className="text-primary">
                One dashboard.
              </span>
            </motion.h2>
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
                <div className="flex items-center gap-3 px-6 py-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all cursor-default">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${provider.color} shadow-lg`}>
                    <provider.icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white/80">{provider.name}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative py-20 sm:py-28">
        <div className="container-marketing">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp}>
              <Badge className="mb-4 bg-white/5 border-white/10 text-white/60">Features</Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold tracking-tight text-white"
            >
              Built for teams that{' '}
              <span className="text-primary">
                take AI seriously
              </span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mt-4 text-lg text-white/40 max-w-2xl mx-auto"
            >
              Complete visibility into every token your team consumes. No guesswork, no surprises.
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
                <Card className="h-full border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group cursor-default">
                  <CardContent className="p-5">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                      <feature.icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-white/40 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative py-20 sm:py-28">
        <div className="container-marketing">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp}>
              <Badge className="mb-4 bg-white/5 border-white/10 text-white/60">How It Works</Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold tracking-tight text-white"
            >
              Live in{' '}
              <span className="text-primary">
                four commands
              </span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mt-4 text-lg text-white/40 max-w-2xl mx-auto"
            >
              From zero to full visibility in under five minutes.
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
                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-[calc(50%+40px)] right-[-40px] h-[1px] bg-gradient-to-r from-primary/30 to-transparent" />
                  )}

                  <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-5 relative">
                      <step.icon className="h-7 w-7 text-primary" />
                      <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-[0_0_15px_rgba(119,255,46,0.4)]">
                        {i + 1}
                      </div>
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-white/40 leading-relaxed mb-4">
                      {step.description}
                    </p>
                    <code className="block text-xs font-mono text-white/50 bg-white/[0.03] rounded-lg px-3 py-2 border border-white/[0.06]">
                      {step.command}
                    </code>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-20 sm:py-28">
        <div className="container-marketing">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-14"
          >
            <motion.div variants={fadeInUp}>
              <Badge className="mb-4 bg-white/5 border-white/10 text-white/60">Testimonials</Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold tracking-tight text-white"
            >
              Trusted by teams who{' '}
              <span className="text-primary">
                ship fast
              </span>
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
                <Card className="h-full border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all">
                  <CardContent className="p-6">
                    <div className="flex mb-3">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <svg key={j} className="h-4 w-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed mb-4">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                        {t.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/80">{t.author}</p>
                        <p className="text-xs text-white/40">{t.role}, {t.company}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative py-20 sm:py-28">
        <div className="container-marketing">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-14"
          >
            <motion.div variants={fadeInUp}>
              <Badge className="mb-4 bg-white/5 border-white/10 text-white/60">Pricing</Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold tracking-tight text-white"
            >
              Simple, transparent{' '}
              <span className="text-primary">
                pricing
              </span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mt-4 text-lg text-white/40 max-w-2xl mx-auto"
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
                name: 'Free',
                price: '$0',
                period: '/month',
                description: 'For individual developers',
                features: [
                  '100K tokens/month',
                  '1 user',
                  '1 provider',
                  '7-day retention',
                  'Community support',
                ],
                cta: 'Get Started',
                highlighted: false,
              },
              {
                name: 'Team',
                price: '$29',
                period: '/user/month',
                description: 'For growing teams',
                features: [
                  'Unlimited tokens',
                  'Unlimited users',
                  'All providers',
                  '90-day retention',
                  'Budget controls',
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
                  'Unlimited retention',
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
                      ? 'border-primary/30 bg-primary/[0.03] shadow-[0_0_60px_-15px_rgba(119,255,46,0.2)]'
                      : 'border-white/[0.06] bg-white/[0.02]'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="px-3 bg-primary text-primary-foreground border-0 shadow-[0_0_20px_rgba(119,255,46,0.4)]">Most Popular</Badge>
                    </div>
                  )}
                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-white/40 mt-1">
                        {plan.description}
                      </p>
                      <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-white">
                          {plan.price}
                        </span>
                        {plan.period && (
                          <span className="text-sm text-white/40">
                            {plan.period}
                          </span>
                        )}
                      </div>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span className="text-white/70">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${
                        plan.highlighted
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(119,255,46,0.3)]'
                          : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20'
                      } transition-all`}
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

          <p className="text-center text-sm text-white/30 mt-6">
            <Lock className="inline h-3.5 w-3.5 mr-1" />
            We never store your prompts or completions. Only usage metadata for analytics.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-20 sm:py-28">
        <div className="container-narrow">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-14"
          >
            <motion.div variants={fadeInUp}>
              <Badge className="mb-4 bg-white/5 border-white/10 text-white/60">FAQ</Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold tracking-tight text-white"
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
                  className="border-white/[0.06] bg-white/[0.02] px-4 rounded-xl"
                >
                  <AccordionTrigger className="text-sm font-medium text-white/80 hover:no-underline hover:text-white">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-white/40 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 sm:py-28">
        <div className="container-marketing text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold tracking-tight text-white"
            >
              Ready to see where your{' '}
              <span className="text-primary">
                tokens go?
              </span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mt-4 text-lg text-white/40 max-w-xl mx-auto"
            >
              Get started for free. No credit card required. Live in five minutes.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button size="xl" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_40px_rgba(119,255,46,0.3)] hover:shadow-[0_0_60px_rgba(119,255,46,0.5)] transition-all border-0 px-8" asChild>
                <Link href="/register">
                  Start Free
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" className="border-white/10 text-white/70 hover:bg-white/5 hover:text-white hover:border-white/20 transition-all" asChild>
                <Link href="/docs">Read the Docs</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
