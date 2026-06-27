import { notFound } from 'next/navigation';
import fs from 'fs';
import { getDocBySlug, getDocsByCategory, getCategoryMeta } from '@/lib/docs';
import { compileDoc } from '@/lib/docs/mdx';
import { DocsBreadcrumbs } from '@/components/docs/DocsBreadcrumbs';
import { PrevNext } from '@/components/docs/DocsNav';

export function generateStaticParams() {
  const docs = getDocsByCategory('security');
  return docs.map((doc) => ({ slug: doc.slug }));
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = getDocBySlug('security', slug);
  if (!doc) notFound();
  const source = fs.readFileSync(doc.filePath, 'utf-8');
  const { content } = await compileDoc(source);
  const meta = getCategoryMeta('security');
  return (
    <>
      <DocsBreadcrumbs
        items={[
          { label: meta?.label || 'Security', href: '/docs/security' },
          { label: doc.title },
        ]}
      />
      <article className="prose-docs animate-fade-up">{content}</article>
      <PrevNext category="security" currentSlug={slug} />
    </>
  );
}
