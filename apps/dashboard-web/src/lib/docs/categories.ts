export interface CategoryMeta {
  slug: string;
  label: string;
  description: string;
  group: 'User Guides' | 'Developer' | 'Reference' | 'Internal';
  order: number;
}

export const CATEGORIES: CategoryMeta[] = [
  { slug: 'getting-started', label: 'Getting Started', description: 'Quick start guides and onboarding', group: 'User Guides', order: 0 },
  { slug: 'providers', label: 'Providers', description: 'Supported AI providers and integration guides', group: 'User Guides', order: 1 },
  { slug: 'product', label: 'Product', description: 'Feature guides and user documentation', group: 'User Guides', order: 2 },
  { slug: 'api', label: 'API Reference', description: 'Complete API documentation', group: 'Developer', order: 3 },
  { slug: 'architecture', label: 'Architecture', description: 'System design and technical architecture', group: 'Developer', order: 4 },
  { slug: 'cli', label: 'CLI', description: 'Command-line interface reference', group: 'Developer', order: 5 },
  { slug: 'developer', label: 'Developer', description: 'Local development and contribution guides', group: 'Developer', order: 6 },
  { slug: 'design', label: 'Design', description: 'Design system and UI specifications', group: 'Developer', order: 7 },
  { slug: 'security', label: 'Security', description: 'Security architecture and policies', group: 'Reference', order: 8 },
  { slug: 'operations', label: 'Operations', description: 'Deployment, monitoring, and operations', group: 'Reference', order: 9 },
  { slug: 'adr', label: 'Architecture Decisions', description: 'Architecture Decision Records', group: 'Reference', order: 10 },
  { slug: 'legal', label: 'Legal', description: 'Terms of service, privacy policy, and legal documents', group: 'Internal', order: 11 },
  { slug: 'qa', label: 'QA', description: 'Testing guides and checklists', group: 'Internal', order: 12 },
  { slug: 'design-partners', label: 'Design Partners', description: 'Design partner program documentation', group: 'Internal', order: 13 },
  { slug: 'support', label: 'Support', description: 'Support runbooks and incident response', group: 'Internal', order: 14 },
  { slug: 'phases', label: 'Phases', description: 'Development phase documentation', group: 'Internal', order: 15 },
];

export function getCategoryMeta(category: string): CategoryMeta | undefined {
  return CATEGORIES.find((c) => c.slug === category);
}
