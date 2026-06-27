import { getDocsByCategory, getCategoryMeta } from '@/lib/docs';
import { DocsCategoryPage } from '@/components/docs/DocsCategoryPage';
import { DocsBreadcrumbs } from '@/components/docs/DocsBreadcrumbs';

export default function Page() {
  const docs = getDocsByCategory('architecture');
  const meta = getCategoryMeta('architecture');
  return (
    <>
      <DocsBreadcrumbs items={[{ label: meta?.label || 'Architecture' }]} />
      <DocsCategoryPage
        category="architecture"
        title={meta?.label || 'Architecture'}
        description={meta?.description || ''}
        docs={docs}
      />
    </>
  );
}
