import { getDocsByCategory, getCategoryMeta } from '@/lib/docs';
import { DocsCategoryPage } from '@/components/docs/DocsCategoryPage';
import { DocsBreadcrumbs } from '@/components/docs/DocsBreadcrumbs';

export default function QAPage() {
  const docs = getDocsByCategory('qa');
  const meta = getCategoryMeta('qa');
  return (
    <>
      <DocsBreadcrumbs items={[{ label: meta?.label || 'QA' }]} />
      <DocsCategoryPage
        category="qa"
        title={meta?.label || 'QA'}
        description={meta?.description || ''}
        docs={docs}
      />
    </>
  );
}
