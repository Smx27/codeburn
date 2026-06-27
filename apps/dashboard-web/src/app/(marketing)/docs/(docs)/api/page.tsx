import { getDocsByCategory, getCategoryMeta } from '@/lib/docs';
import { DocsCategoryPage } from '@/components/docs/DocsCategoryPage';
import { DocsBreadcrumbs } from '@/components/docs/DocsBreadcrumbs';

export default function Page() {
  const docs = getDocsByCategory('api');
  const meta = getCategoryMeta('api');
  return (
    <>
      <DocsBreadcrumbs items={[{ label: meta?.label || 'API Reference' }]} />
      <DocsCategoryPage
        category="api"
        title={meta?.label || 'API Reference'}
        description={meta?.description || ''}
        docs={docs}
      />
    </>
  );
}
