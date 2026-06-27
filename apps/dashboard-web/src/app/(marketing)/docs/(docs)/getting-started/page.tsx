import { getDocsByCategory, getCategoryMeta } from '@/lib/docs';
import { DocsCategoryPage } from '@/components/docs/DocsCategoryPage';
import { DocsBreadcrumbs } from '@/components/docs/DocsBreadcrumbs';

export default function GettingStartedPage() {
  const docs = getDocsByCategory('getting-started');
  const meta = getCategoryMeta('getting-started');

  return (
    <>
      <DocsBreadcrumbs items={[{ label: meta?.label || 'Getting Started' }]} />
      <DocsCategoryPage
        category="getting-started"
        title={meta?.label || 'Getting Started'}
        description={meta?.description || ''}
        docs={docs}
      />
    </>
  );
}
