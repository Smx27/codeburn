import { getDocsByCategory, getCategoryMeta } from '@/lib/docs';
import { DocsCategoryPage } from '@/components/docs/DocsCategoryPage';
import { DocsBreadcrumbs } from '@/components/docs/DocsBreadcrumbs';

export default function Page() {
  const docs = getDocsByCategory('cli');
  const meta = getCategoryMeta('cli');
  return (
    <>
      <DocsBreadcrumbs items={[{ label: meta?.label || 'CLI' }]} />
      <DocsCategoryPage
        category="cli"
        title={meta?.label || 'CLI'}
        description={meta?.description || ''}
        docs={docs}
      />
    </>
  );
}
