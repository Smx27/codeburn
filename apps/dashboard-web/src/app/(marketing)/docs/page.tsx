'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Code,
  Shield,
  Zap,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

const resources = [
  {
    title: 'Getting Started',
    description: 'Quick start guide to install the agent and connect your first machine.',
    icon: Zap,
    href: '/docs/getting-started',
    badge: 'Popular',
  },
  {
    title: 'API Reference',
    description: 'Complete API documentation for programmatic access.',
    icon: Code,
    href: '/docs/api',
    badge: null,
  },
  {
    title: 'Security',
    description: 'How we protect your data and what we collect.',
    icon: Shield,
    href: '/docs/security',
    badge: null,
  },
  {
    title: 'Providers',
    description: 'Supported AI providers and integration guides.',
    icon: BookOpen,
    href: '/docs/providers',
    badge: null,
  },
];

export default function DocsPage() {
  return (
    <div className="section-padding">
      <div className="container-marketing">
        <div className="text-center mb-12">
          <Badge variant="info" className="mb-4">Documentation</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Documentation
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to get started with AIInsight.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {resources.map((resource) => (
            <Link key={resource.title} href={resource.href}>
              <Card className="glass-card h-full border-border/30 hover:border-primary/20 group cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-subtle">
                      <resource.icon className="h-5 w-5 text-primary" />
                    </div>
                    {resource.badge && (
                      <Badge variant="info" className="text-xs">{resource.badge}</Badge>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {resource.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground mb-4">
            Can&apos;t find what you&apos;re looking for?
          </p>
          <Button variant="outline" asChild>
            <Link href="mailto:support@aiinsight.dev">
              Contact Support
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
