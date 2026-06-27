import { getDocsByCategory, getCategoryMeta } from '@/lib/docs';
import { DocsCategoryPage } from '@/components/docs/DocsCategoryPage';
import { DocsBreadcrumbs } from '@/components/docs/DocsBreadcrumbs';

export default function PhasesPage() {
  const docs = getDocsByCategory('phases');
  const meta = getCategoryMeta('phases');
  return (
    <>
      <DocsBreadcrumbs items={[{ label: meta?.label || 'Phases' }]} />
      <DocsCategoryPage
        category="phases"
        title={meta?.label || 'Phases'}
        description={meta?.description || ''}
        docs={docs}
      />
    </>
  );
}
