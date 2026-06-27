import { DocsSidebar } from '@/components/docs/DocsSidebar';
import { DocsTOC } from '@/components/docs/DocsTOC';
import { DocsSearch } from '@/components/docs/DocsSearch';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="section-padding">
      <div className="container-marketing">
        <div className="flex items-center justify-between mb-8">
          <div />
          <DocsSearch />
        </div>
        <div className="flex gap-8">
          <DocsSidebar />
          <main className="flex-1 min-w-0 max-w-3xl">
            {children}
          </main>
          <DocsTOC />
        </div>
      </div>
    </div>
  );
}
