'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, ChevronRight, Menu, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CATEGORIES } from '@/lib/docs/categories';
import { cn } from '@/lib/utils';

const GROUPS = ['User Guides', 'Developer', 'Reference', 'Internal'] as const;

export function DocsSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const cat of CATEGORIES) {
      initial[cat.slug] = pathname.includes(`/docs/${cat.slug}`);
    }
    return initial;
  });

  const toggleCategory = (slug: string) => {
    setExpanded((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  const isActive = (href: string) => pathname === href;

  const sidebarContent = (
    <nav className="space-y-6">
      {GROUPS.map((group) => {
        const cats = CATEGORIES.filter((c) => c.group === group);
        if (cats.length === 0) return null;
        return (
          <div key={group}>
            <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-3">
              {group}
            </h4>
            <div className="space-y-0.5">
              {cats.map((cat) => (
                <div key={cat.slug}>
                  <button
                    onClick={() => toggleCategory(cat.slug)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors',
                      'hover:bg-white/[0.04] text-white/70 hover:text-white'
                    )}
                  >
                    {expanded[cat.slug] ? (
                      <ChevronDown className="h-3.5 w-3.5 text-white/30" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-white/30" />
                    )}
                    <span>{cat.label}</span>
                  </button>
                  {expanded[cat.slug] && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/[0.06] pl-3">
                      <Link
                        href={`/docs/${cat.slug}`}
                        className={cn(
                          'block px-3 py-1.5 text-sm rounded-lg transition-colors',
                          isActive(`/docs/${cat.slug}`)
                            ? 'text-primary bg-primary/10'
                            : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                        )}
                      >
                        Overview
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-4 left-4 z-50 flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/20"
      >
        <Menu className="h-4 w-4" />
        <span className="text-sm font-medium">Docs</span>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-background/95 backdrop-blur-xl border-r border-white/[0.08] p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Documentation</h2>
              <button onClick={() => setMobileOpen(false)} className="text-white/50 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <ScrollArea className="h-[calc(100vh-80px)]">
              {sidebarContent}
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-20">
          <ScrollArea className="h-[calc(100vh-100px)]">
            {sidebarContent}
          </ScrollArea>
        </div>
      </aside>
    </>
  );
}
