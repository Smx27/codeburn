'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, X, FileText } from 'lucide-react';
import { CATEGORIES } from '@/lib/docs/categories';

interface DocIndex {
  slug: string;
  title: string;
  category: string;
}

export function DocsSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<DocIndex[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    const allDocs: DocIndex[] = [];

    for (const cat of CATEGORIES) {
      allDocs.push({ slug: cat.slug, title: cat.label, category: cat.slug });
    }

    const filtered = allDocs.filter(
      (doc) =>
        doc.title.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q) ||
        doc.slug.toLowerCase().includes(q)
    );

    setResults(filtered.slice(0, 10));
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      setOpen(false);
      setQuery('');
    }
  };

  const getCategoryLabel = (slug: string) => {
    const cat = CATEGORIES.find((c) => c.slug === slug);
    return cat?.label || slug;
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/40 bg-white/[0.04] border border-white/[0.08] rounded-lg hover:bg-white/[0.06] hover:text-white/60 transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search docs...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-white/30 bg-white/[0.04] border border-white/[0.06] rounded">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg">
            <div className="bg-background/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 border-b border-white/[0.08]">
                <Search className="h-4 w-4 text-white/40" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search documentation..."
                  className="flex-1 py-3 bg-transparent text-foreground text-sm outline-none placeholder:text-white/30"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="text-white/30 hover:text-white/60">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {results.length > 0 && (
                <div className="max-h-80 overflow-y-auto p-2">
                  {results.map((doc, i) => (
                    <Link
                      key={doc.slug}
                      href={`/docs/${doc.slug}`}
                      onClick={() => { setOpen(false); setQuery(''); }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        i === selectedIndex
                          ? 'bg-primary/10 text-primary'
                          : 'text-white/70 hover:bg-white/[0.04]'
                      }`}
                    >
                      <FileText className="h-4 w-4 shrink-0 opacity-50" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{doc.title}</div>
                        <div className="text-xs text-white/30">{getCategoryLabel(doc.category)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {query && results.length === 0 && (
                <div className="p-8 text-center text-sm text-white/40">
                  No results found for &quot;{query}&quot;
                </div>
              )}

              {!query && (
                <div className="p-4 text-center text-sm text-white/30">
                  Type to search across all documentation
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
