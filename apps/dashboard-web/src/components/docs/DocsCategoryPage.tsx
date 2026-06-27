import Link from 'next/link';
import { FileText, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { DocMeta } from '@/lib/docs';

export function DocsCategoryPage({
  category,
  title,
  description,
  docs,
}: {
  category: string;
  title: string;
  description: string;
  docs: DocMeta[];
}) {
  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">{title}</h1>
        <p className="mt-3 text-muted-foreground">{description}</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {docs.map((doc, i) => (
          <Link
            key={doc.slug}
            href={`/docs/${category}/${doc.slug}`}
            className="animate-fade-up"
            style={{ animationDelay: `${(i + 1) * 60}ms` }}
          >
            <Card className="glass-card group cursor-pointer hover:border-primary/20">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {doc.title}
                  </h3>
                </div>
                <ArrowRight className="h-4 w-4 text-white/20 group-hover:text-primary transition-colors shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
