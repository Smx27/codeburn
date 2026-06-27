import { getDocsByCategory, getCategoryMeta } from '@/lib/docs';
import { DocsCategoryPage } from '@/components/docs/DocsCategoryPage';
import { DocsBreadcrumbs } from '@/components/docs/DocsBreadcrumbs';

export default function ProvidersPage() {
  const docs = getDocsByCategory('providers');
  const meta = getCategoryMeta('providers');
  return (
    <>
      <DocsBreadcrumbs items={[{ label: meta?.label || 'Providers' }]} />
      <DocsCategoryPage
        category="providers"
        title={meta?.label || 'Providers'}
        description={meta?.description || ''}
        docs={docs}
      />
    </>
  );
}
