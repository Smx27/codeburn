import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getDocsByCategory } from '@/lib/docs';

export function PrevNext({ category, currentSlug }: { category: string; currentSlug: string }) {
  const docs = getDocsByCategory(category);
  const currentIndex = docs.findIndex((d) => d.slug === currentSlug);
  const prev = currentIndex > 0 ? docs[currentIndex - 1] : null;
  const next = currentIndex < docs.length - 1 ? docs[currentIndex + 1] : null;

  if (!prev && !next) return null;

  return (
    <div className="flex items-center justify-between gap-4 mt-12 pt-6 border-t border-white/[0.08]">
      {prev ? (
        <Link
          href={`/docs/${category}/${prev.slug}`}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-primary transition-colors group"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="truncate max-w-[200px]">{prev.title}</span>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={`/docs/${category}/${next.slug}`}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-primary transition-colors group"
        >
          <span className="truncate max-w-[200px]">{next.title}</span>
          <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
