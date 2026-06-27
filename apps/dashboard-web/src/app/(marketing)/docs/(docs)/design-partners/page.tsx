import { getDocsByCategory, getCategoryMeta } from '@/lib/docs';
import { DocsCategoryPage } from '@/components/docs/DocsCategoryPage';
import { DocsBreadcrumbs } from '@/components/docs/DocsBreadcrumbs';

export default function DesignPartnersPage() {
  const docs = getDocsByCategory('design-partners');
  const meta = getCategoryMeta('design-partners');
  return (
    <>
      <DocsBreadcrumbs items={[{ label: meta?.label || 'Design Partners' }]} />
      <DocsCategoryPage
        category="design-partners"
        title={meta?.label || 'Design Partners'}
        description={meta?.description || ''}
        docs={docs}
      />
    </>
  );
}
