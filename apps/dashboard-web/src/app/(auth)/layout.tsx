'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const Spline = dynamic(
  () => import('@splinetool/react-spline').then((mod) => mod.default),
  { ssr: false }
);

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="sentinel relative flex min-h-screen items-center justify-center overflow-hidden bg-hero-bg">
      {/* Spline 3D Background */}
      <div className="absolute inset-0">
        <Suspense fallback={<div className="absolute inset-0 bg-hero-bg" />}>
          <Spline
            scene="https://prod.spline.design/Slk6b8kz3LRlKiyk/scene.splinecode"
            className="w-full h-full"
          />
        </Suspense>
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40 z-[1] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-[420px] px-4 py-12">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center mb-8">
          <span className="text-2xl font-bold tracking-tight text-foreground uppercase">
            NIRIKSH
          </span>
        </Link>

        {children}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="text-foreground/80 hover:text-foreground transition-colors">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-foreground/80 hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
