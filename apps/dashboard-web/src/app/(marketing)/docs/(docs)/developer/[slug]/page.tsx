import { notFound } from 'next/navigation';
import fs from 'fs';
import { getDocBySlug, getDocsByCategory, getCategoryMeta } from '@/lib/docs';
import { compileDoc } from '@/lib/docs/mdx';
import { DocsBreadcrumbs } from '@/components/docs/DocsBreadcrumbs';
import { PrevNext } from '@/components/docs/DocsNav';

export function generateStaticParams() {
  const docs = getDocsByCategory('developer');
  return docs.map((doc) => ({ slug: doc.slug }));
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = getDocBySlug('developer', slug);
  if (!doc) notFound();
  const source = fs.readFileSync(doc.filePath, 'utf-8');
  const { content } = await compileDoc(source);
  const meta = getCategoryMeta('developer');
  return (
    <>
      <DocsBreadcrumbs
        items={[
          { label: meta?.label || 'Developer', href: '/docs/developer' },
          { label: doc.title },
        ]}
      />
      <article className="prose-docs animate-fade-up">{content}</article>
      <PrevNext category="developer" currentSlug={slug} />
    </>
  );
}
