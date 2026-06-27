import { compileMDX } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrettyCode from 'rehype-pretty-code';
import { Mermaid } from '@/components/docs/Mermaid';

const components = {
  Mermaid,
};

function preprocessMarkdown(source: string): string {
  const cleaned = source.replace(/<!--[\s\S]*?-->/g, '');

  const parts: string[] = [];
  let i = 0;
  while (i < cleaned.length) {
    if (cleaned[i] === '`') {
      const end = cleaned.indexOf('`', i + 1);
      if (end === -1) {
        parts.push(cleaned.slice(i));
        break;
      }
      parts.push(cleaned.slice(i, end + 1));
      i = end + 1;
    } else if (cleaned.slice(i, i + 3) === '```') {
      const end = cleaned.indexOf('```', i + 3);
      if (end === -1) {
        parts.push(cleaned.slice(i));
        break;
      }
      parts.push(cleaned.slice(i, end + 3));
      i = end + 3;
    } else if (cleaned[i] === '<') {
      parts.push('&lt;');
      i++;
    } else {
      parts.push(cleaned[i]);
      i++;
    }
  }

  return parts.join('');
}

export async function compileDoc(source: string) {
  const cleaned = preprocessMarkdown(source);

  const { content, frontmatter } = await compileMDX({
    source: cleaned,
    components,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'wrap' }],
          [rehypePrettyCode, { theme: 'github-dark' }],
        ],
      },
    },
  });

  return { content, frontmatter };
}
