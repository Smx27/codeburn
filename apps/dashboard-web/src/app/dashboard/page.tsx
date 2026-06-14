'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardShell } from '@/components/DashboardShell';
import { OverviewPage } from '@/components/pages/OverviewPage';

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-base p-6">
            <div className="space-y-3">
              <div className="h-3 w-20 rounded bg-muted animate-shimmer" />
              <div className="h-7 w-28 rounded bg-muted animate-shimmer" />
              <div className="h-3 w-16 rounded bg-muted animate-shimmer" />
            </div>
          </div>
        ))}
      </div>
      <div className="card-base p-6">
        <div className="space-y-4">
          <div className="h-4 w-32 rounded bg-muted animate-shimmer" />
          <div className="h-48 rounded-lg bg-muted animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardShell>
      <OverviewPage />
    </DashboardShell>
  );
}
