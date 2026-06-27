import { getDocsByCategory, getCategoryMeta } from '@/lib/docs';
import { DocsCategoryPage } from '@/components/docs/DocsCategoryPage';
import { DocsBreadcrumbs } from '@/components/docs/DocsBreadcrumbs';

export default function DeveloperPage() {
  const docs = getDocsByCategory('developer');
  const meta = getCategoryMeta('developer');
  return (
    <>
      <DocsBreadcrumbs items={[{ label: meta?.label || 'Developer' }]} />
      <DocsCategoryPage
        category="developer"
        title={meta?.label || 'Developer'}
        description={meta?.description || ''}
        docs={docs}
      />
    </>
  );
}
