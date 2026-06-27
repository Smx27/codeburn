import { getDocsByCategory, getCategoryMeta } from '@/lib/docs';
import { DocsCategoryPage } from '@/components/docs/DocsCategoryPage';
import { DocsBreadcrumbs } from '@/components/docs/DocsBreadcrumbs';

export default function LegalPage() {
  const docs = getDocsByCategory('legal');
  const meta = getCategoryMeta('legal');
  return (
    <>
      <DocsBreadcrumbs items={[{ label: meta?.label || 'Legal' }]} />
      <DocsCategoryPage
        category="legal"
        title={meta?.label || 'Legal'}
        description={meta?.description || ''}
        docs={docs}
      />
    </>
  );
}
