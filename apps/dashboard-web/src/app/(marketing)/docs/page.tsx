'use client';

import Link from 'next/link';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function DocsPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-20">
      <div className="container-narrow text-center">
        <Card className="border-border/50">
          <CardContent className="p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-subtle mb-6">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">
              Documentation coming soon
            </h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              We&apos;re working on comprehensive documentation for AIInsight.
              In the meantime, check out our quickstart guide or reach out to
              support.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
