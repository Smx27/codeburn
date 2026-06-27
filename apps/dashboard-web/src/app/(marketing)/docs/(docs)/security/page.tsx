import { getDocsByCategory, getCategoryMeta } from '@/lib/docs';
import { DocsCategoryPage } from '@/components/docs/DocsCategoryPage';
import { DocsBreadcrumbs } from '@/components/docs/DocsBreadcrumbs';

export default function SecurityPage() {
  const docs = getDocsByCategory('security');
  const meta = getCategoryMeta('security');
  return (
    <>
      <DocsBreadcrumbs items={[{ label: meta?.label || 'Security' }]} />
      <DocsCategoryPage
        category="security"
        title={meta?.label || 'Security'}
        description={meta?.description || ''}
        docs={docs}
      />
    </>
  );
}
