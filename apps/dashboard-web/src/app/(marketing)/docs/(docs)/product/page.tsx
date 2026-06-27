import { getDocsByCategory, getCategoryMeta } from '@/lib/docs';
import { DocsCategoryPage } from '@/components/docs/DocsCategoryPage';
import { DocsBreadcrumbs } from '@/components/docs/DocsBreadcrumbs';

export default function ProductPage() {
  const docs = getDocsByCategory('product');
  const meta = getCategoryMeta('product');
  return (
    <>
      <DocsBreadcrumbs items={[{ label: meta?.label || 'Product' }]} />
      <DocsCategoryPage
        category="product"
        title={meta?.label || 'Product'}
        description={meta?.description || ''}
        docs={docs}
      />
    </>
  );
}
