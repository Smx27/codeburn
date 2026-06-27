'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Mail } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-destructive/10 p-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Dashboard error</h2>
            <p className="text-sm text-muted-foreground">
              Failed to load dashboard data. Please try again or contact support.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={reset} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href="mailto:support@niriksh.dev">
                <Mail className="mr-2 h-4 w-4" />
                Contact Support
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
