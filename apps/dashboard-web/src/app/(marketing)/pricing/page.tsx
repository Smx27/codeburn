'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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

const plans = [
  {
    name: 'Free Beta',
    price: '$0',
    period: '/month',
    description: 'For individual developers getting started',
    features: [
      'Basic usage analytics',
      '1 user',
      '5 machines',
      '7-day data retention',
      'Community support',
      'Standard providers',
    ],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    name: 'Team',
    price: '$19',
    period: '/user/month',
    description: 'For teams that need full visibility',
    features: [
      'Full usage analytics',
      'Unlimited users',
      'Unlimited machines',
      '90-day data retention',
      'Historical sync (90 days)',
      'Priority support',
      'Advanced charts',
      'Export data',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations with compliance needs',
    features: [
      'Everything in Team',
      'Unlimited data retention',
      'SSO & SAML',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
      'Audit logs',
      'Custom retention policies',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

const faqs = [
  {
    question: 'Is there a free tier?',
    answer: 'Yes! Our Free Beta plan is completely free and includes basic analytics, 1 user, and 5 machines. No credit card required to get started.',
  },
  {
    question: 'How does the Team plan billing work?',
    answer: 'The Team plan is billed per user per month. Each user gets full access to all features. You can add or remove users at any time, and billing is prorated.',
  },
  {
    question: 'Can I try the Team plan before committing?',
    answer: 'Absolutely. Start a free 14-day trial of the Team plan with full access to all features. No credit card required.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, Amex) and ACH bank transfers for annual plans. Enterprise customers can also pay via invoice.',
  },
  {
    question: 'How do I upgrade or downgrade?',
    answer: 'You can change your plan at any time from your account settings. Upgrades take effect immediately with prorated billing. Downgrades take effect at the end of your current billing period.',
  },
  {
    question: 'Do you offer discounts for startups?',
    answer: 'Yes! We offer special pricing for early-stage startups. Contact our sales team to learn more about our startup program.',
  },
];

export default function PricingPage() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="section-padding">
        <div className="container-marketing">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp}>
              <Badge variant="info" className="mb-6 px-4 py-1.5">
                Pricing
              </Badge>
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl font-bold tracking-tight"
            >
              Simple, transparent{' '}
              <span className="text-gradient">pricing</span>
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Start free, scale as you grow. No surprises, no hidden fees.
            </motion.p>
          </motion.div>

          {/* Plans */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {plans.map((plan) => (
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
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            <Lock className="inline h-3.5 w-3.5 mr-1" />
            We never store your prompts or responses. Only usage metadata for analytics.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-background-subtle/30">
        <div className="container-narrow">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-14"
          >
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
    </div>
  );
}
