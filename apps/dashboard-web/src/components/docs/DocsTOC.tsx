'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export function DocsTOC() {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const article = document.querySelector('.prose-docs');
    if (!article) return;

    const elements = article.querySelectorAll('h2, h3');
    const items: TOCItem[] = Array.from(elements).map((el) => ({
      id: el.id,
      text: el.textContent || '',
      level: el.tagName === 'H2' ? 2 : 3,
    }));
    setHeadings(items);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  if (headings.length === 0) return null;

  return (
    <aside className="hidden xl:block w-56 shrink-0">
      <div className="sticky top-20">
        <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
          On this page
        </h4>
        <nav className="space-y-1">
          {headings.map((heading) => (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              className={cn(
                'block text-sm py-1 transition-colors border-l-2',
                heading.level === 3 ? 'pl-6' : 'pl-3',
                activeId === heading.id
                  ? 'text-primary border-primary'
                  : 'text-white/40 hover:text-white/70 border-transparent'
              )}
            >
              {heading.text}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}
