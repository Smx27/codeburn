import fs from 'fs';
import path from 'path';
import { CATEGORIES } from './categories';

export interface DocMeta {
  slug: string;
  title: string;
  category: string;
  filePath: string;
  order: number;
}

const DOCS_ROOT = path.join(process.cwd(), '..', '..', 'docs');

function getTitleFromContent(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  if (match) return match[1].trim();
  return '';
}

function getTitleFromFilename(filename: string): string {
  return filename
    .replace(/\.md$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getDocsByCategory(category: string): DocMeta[] {
  const categoryDir = path.join(DOCS_ROOT, category);

  if (category === 'security') {
    const secFile = path.join(DOCS_ROOT, 'architecture', 'security.md');
    if (fs.existsSync(secFile)) {
      const content = fs.readFileSync(secFile, 'utf-8');
      const title = getTitleFromContent(content) || 'Security';
      return [{ slug: 'security', title, category: 'security', filePath: secFile, order: 0 }];
    }
    return [];
  }

  if (!fs.existsSync(categoryDir)) return [];

  const files = fs.readdirSync(categoryDir).filter((f) => f.endsWith('.md'));

  return files
    .map((file, index) => {
      const slug = file.replace(/\.md$/, '');
      const filePath = path.join(categoryDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const title = getTitleFromContent(content) || getTitleFromFilename(file);
      return { slug, title, category, filePath, order: index };
    })
    .sort((a, b) => {
      const numA = a.slug.match(/^(\d+|ADR-(\d+))/);
      const numB = b.slug.match(/^(\d+|ADR-(\d+))/);
      if (numA && numB) return numA[0].localeCompare(numB[0]);
      if (numA) return -1;
      if (numB) return 1;
      if (a.slug === 'README') return -1;
      if (b.slug === 'README') return 1;
      return a.slug.localeCompare(b.slug);
    });
}

export function getAllDocs(): DocMeta[] {
  const allDocs: DocMeta[] = [];

  for (const cat of CATEGORIES) {
    allDocs.push(...getDocsByCategory(cat.slug));
  }

  const rootDocs = ['architecture.md', 'roadmap.md', 'ui-design-system.md'];
  for (const file of rootDocs) {
    const filePath = path.join(DOCS_ROOT, file);
    if (fs.existsSync(filePath)) {
      const slug = file.replace(/\.md$/, '');
      const content = fs.readFileSync(filePath, 'utf-8');
      const title = getTitleFromContent(content) || getTitleFromFilename(file);
      const category = slug === 'architecture' ? 'architecture' : slug;
      allDocs.push({ slug, title, category, filePath, order: 999 });
    }
  }

  return allDocs;
}

export function getDocBySlug(category: string, slug: string): DocMeta | null {
  if (category === 'security' && slug === 'security') {
    const secFile = path.join(DOCS_ROOT, 'architecture', 'security.md');
    if (fs.existsSync(secFile)) {
      return { slug, title: 'Security', category, filePath: secFile, order: 0 };
    }
    return null;
  }

  const docs = getDocsByCategory(category);
  return docs.find((d) => d.slug === slug) || null;
}

export function getDocsIndex() {
  return getAllDocs().map((doc) => ({
    slug: doc.slug,
    title: doc.title,
    category: doc.category,
    summary: doc.title,
  }));
}
