'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowRight } from 'lucide-react';

const Spline = dynamic(
  () => import('@splinetool/react-spline').then((mod) => mod.default),
  { ssr: false }
);

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-end bg-hero-bg overflow-hidden">
      <div className="absolute inset-0">
        <Suspense fallback={<div className="absolute inset-0 bg-hero-bg" />}>
          <Spline
            scene="https://prod.spline.design/Slk6b8kz3LRlKiyk/scene.splinecode"
            className="w-full h-full"
          />
        </Suspense>
      </div>

      <div className="absolute inset-0 bg-black/30 z-[1] pointer-events-none" />

      <div className="relative z-10 pointer-events-none w-full max-w-[90%] sm:max-w-md lg:max-w-2xl px-6 md:px-10 pb-10 md:pb-10 pt-32">
        <h1
          className="text-[clamp(3rem,8vw,6rem)] font-bold leading-[1.05] tracking-[-0.05em] text-foreground mb-2 md:mb-4 uppercase opacity-0 animate-fade-up"
          style={{ animationDelay: '0.2s' }}
        >
          NIRIKSH
        </h1>

        <p
          className="text-foreground/80 text-[clamp(1.125rem,2.5vw,1.875rem)] font-light mb-3 md:mb-6 opacity-0 animate-fade-up"
          style={{ animationDelay: '0.4s' }}
        >
          Every Token. Total Visibility.
        </p>

        <p
          className="text-muted-foreground text-[clamp(0.875rem,1.5vw,1.25rem)] font-light mb-4 md:mb-8 opacity-0 animate-fade-up"
          style={{ animationDelay: '0.55s' }}
        >
          Track AI token usage across every provider, every model, every engineer.
          Real-time cost intelligence that pays for itself on day one.
        </p>

        <div
          className="flex flex-wrap gap-3 font-bold opacity-0 animate-fade-up"
          style={{ animationDelay: '0.7s' }}
        >
          <Link
            href="/register"
            className="pointer-events-auto bg-primary text-primary-foreground px-6 py-3 md:px-8 md:py-4 text-sm rounded-sm cursor-pointer hover:brightness-110 transition-all active:scale-[0.97] inline-flex items-center gap-2"
          >
            Start Free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/docs"
            className="pointer-events-auto bg-white text-background px-6 py-3 md:px-8 md:py-4 text-sm rounded-sm cursor-pointer hover:brightness-90 transition-all active:scale-[0.97] inline-flex items-center"
          >
            View Documentation
          </Link>
        </div>

        <p
          className="text-muted-foreground/60 text-xs font-light mt-4 md:mt-6 opacity-0 animate-fade-up"
          style={{ animationDelay: '0.85s' }}
        >
          No credit card required. Free tier available. Open source.
        </p>
      </div>
    </section>
  );
}
