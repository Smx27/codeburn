'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Github, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/#features', label: 'Features' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/docs', label: 'Docs' },
];

const footerSections = [
  {
    title: 'Product',
    links: [
      { href: '/#features', label: 'Features' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/docs', label: 'Documentation' },
      { href: '/docs/changelog', label: 'Changelog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/blog', label: 'Blog' },
      { href: '/careers', label: 'Careers' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms of Service' },
      { href: '/security', label: 'Security' },
    ],
  },
  {
    title: 'Support',
    links: [
      { href: '/docs', label: 'Documentation' },
      { href: 'mailto:support@niriksh.dev', label: 'Contact Support' },
      { href: 'https://status.niriksh.dev', label: 'Status Page' },
      { href: 'https://github.com/Smx27/codeburn', label: 'GitHub' },
    ],
  },
];

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          scrolled
            ? 'bg-hero-bg/80 backdrop-blur-2xl border-b border-white/[0.06]'
            : 'bg-transparent'
        )}
      >
        <div className="flex h-16 items-center justify-between px-8 lg:px-16 py-5">
          <Link href="/" className="text-foreground text-xl font-semibold tracking-tight">
            NIRIKSH
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Button variant="navCta" size="lg" className="rounded-lg uppercase text-xs tracking-widest px-6" asChild>
              <Link href="/register">
                Start Free
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-white/[0.06] bg-hero-bg/95 backdrop-blur-2xl animate-fade-in-down">
            <div className="container-marketing py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2.5 text-sm font-medium text-white/60 rounded-lg transition-colors hover:text-white hover:bg-white/5"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-white/[0.06] flex flex-col gap-2">
                <Button variant="ghost" className="justify-start text-white/60 hover:text-white hover:bg-white/5" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button className="w-full bg-primary text-primary-foreground" asChild>
                  <Link href="/register">
                    Start Free
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 pt-16">{children}</main>

      <footer className="border-t border-white/[0.06] bg-hero-bg">
        <div className="container-marketing py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2.5">
                <span className="text-base font-bold tracking-tight text-white">
                  NIRIKSH
                </span>
              </Link>
              <p className="mt-4 text-sm text-white/40 leading-relaxed max-w-xs">
                AI token usage intelligence. Track, analyze, and optimize every token across your entire organization.
              </p>
            </div>

            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-sm font-semibold text-white/80 mb-3">
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/40 transition-colors hover:text-white/80"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/30">
              &copy; {new Date().getFullYear()} Niriksh. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="https://github.com/Smx27/codeburn"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                <Github className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
