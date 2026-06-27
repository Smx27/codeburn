import { getDocsByCategory, getCategoryMeta } from '@/lib/docs';
import { DocsCategoryPage } from '@/components/docs/DocsCategoryPage';
import { DocsBreadcrumbs } from '@/components/docs/DocsBreadcrumbs';

export default function OperationsPage() {
  const docs = getDocsByCategory('operations');
  const meta = getCategoryMeta('operations');
  return (
    <>
      <DocsBreadcrumbs items={[{ label: meta?.label || 'Operations' }]} />
      <DocsCategoryPage
        category="operations"
        title={meta?.label || 'Operations'}
        description={meta?.description || ''}
        docs={docs}
      />
    </>
  );
}
