import { getDocsByCategory, getCategoryMeta } from '@/lib/docs';
import { DocsCategoryPage } from '@/components/docs/DocsCategoryPage';
import { DocsBreadcrumbs } from '@/components/docs/DocsBreadcrumbs';

export default function SupportPage() {
  const docs = getDocsByCategory('support');
  const meta = getCategoryMeta('support');
  return (
    <>
      <DocsBreadcrumbs items={[{ label: meta?.label || 'Support' }]} />
      <DocsCategoryPage
        category="support"
        title={meta?.label || 'Support'}
        description={meta?.description || ''}
        docs={docs}
      />
    </>
  );
}
