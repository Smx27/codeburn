import { getDocsByCategory, getCategoryMeta } from '@/lib/docs';
import { DocsCategoryPage } from '@/components/docs/DocsCategoryPage';
import { DocsBreadcrumbs } from '@/components/docs/DocsBreadcrumbs';

export default function DesignPage() {
  const docs = getDocsByCategory('design');
  const meta = getCategoryMeta('design');
  return (
    <>
      <DocsBreadcrumbs items={[{ label: meta?.label || 'Design' }]} />
      <DocsCategoryPage
        category="design"
        title={meta?.label || 'Design'}
        description={meta?.description || ''}
        docs={docs}
      />
    </>
  );
}
