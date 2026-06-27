import { getDocsByCategory, getCategoryMeta } from '@/lib/docs';
import { DocsCategoryPage } from '@/components/docs/DocsCategoryPage';
import { DocsBreadcrumbs } from '@/components/docs/DocsBreadcrumbs';

export default function ADRPage() {
  const docs = getDocsByCategory('adr');
  const meta = getCategoryMeta('adr');
  return (
    <>
      <DocsBreadcrumbs items={[{ label: meta?.label || 'Architecture Decisions' }]} />
      <DocsCategoryPage
        category="adr"
        title={meta?.label || 'Architecture Decisions'}
        description={meta?.description || ''}
        docs={docs}
      />
    </>
  );
}
