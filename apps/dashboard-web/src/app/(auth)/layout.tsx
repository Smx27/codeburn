'use client';

import Link from 'next/link';
import { Flame } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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

      <div className="relative w-full max-w-[420px] space-y-6 animate-fade-in-up">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <Link href="/" className="flex items-center justify-center h-12 w-12 rounded-2xl bg-primary shadow-glow transition-transform hover:scale-105">
            <Flame className="h-6 w-6 text-primary-foreground" />
          </Link>
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              AIInsight
            </h1>
          </div>
        </div>

        {children}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="text-foreground hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-foreground hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
