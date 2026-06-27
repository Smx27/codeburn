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
  FileText,
  Terminal,
  Users,
  Layers,
  Scale,
  Settings,
  Beaker,
  Handshake,
  LifeBuoy,
  GitBranch,
  Palette,
  Rocket,
  BarChart3,
} from 'lucide-react';
import { CATEGORIES } from '@/lib/docs/categories';

const ICONS: Record<string, typeof Zap> = {
  'getting-started': Zap,
  'providers': BookOpen,
  'product': BarChart3,
  'api': Code,
  'architecture': Layers,
  'cli': Terminal,
  'developer': Settings,
  'design': Palette,
  'security': Shield,
  'operations': Rocket,
  'adr': GitBranch,
  'legal': Scale,
  'qa': Beaker,
  'design-partners': Handshake,
  'support': LifeBuoy,
  'phases': FileText,
};

const GROUP_ORDER = ['User Guides', 'Developer', 'Reference', 'Internal'] as const;

export default function DocsPage() {
  const grouped = GROUP_ORDER.map((group) => ({
    group,
    categories: CATEGORIES.filter((c) => c.group === group),
  }));

  return (
    <div className="section-padding">
      <div className="container-marketing">
        <div className="text-center mb-12 animate-fade-up">
          <Badge variant="info" className="mb-4">Documentation</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Documentation
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to get started with Niriksh.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-10">
          {grouped.map(({ group, categories }) => (
            <div key={group} className="animate-fade-up" style={{ animationDelay: `${GROUP_ORDER.indexOf(group) * 80}ms` }}>
              <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">
                {group}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat, i) => {
                  const Icon = ICONS[cat.slug] || FileText;
                  return (
                    <Link key={cat.slug} href={`/docs/${cat.slug}`}>
                      <Card className="glass-card h-full border-border/30 hover:border-primary/20 group cursor-pointer">
                        <CardContent className="p-5">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                              {cat.label}
                            </h3>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {cat.description}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12 animate-fade-up" style={{ animationDelay: '600ms' }}>
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
