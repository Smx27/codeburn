import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function DocsBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-white/40 mb-6">
      <Link href="/docs" className="hover:text-white/70 transition-colors">
        Docs
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3" />
          {item.href ? (
            <Link href={item.href} className="hover:text-white/70 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-white/70">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
