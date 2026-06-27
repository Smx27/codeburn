'use client';

import { useEffect, useRef, useState } from 'react';

interface MermaidProps {
  chart: string;
}

export function Mermaid({ chart }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            primaryColor: 'rgba(119, 255, 71, 0.15)',
            primaryTextColor: '#e5e5e5',
            primaryBorderColor: 'rgba(119, 255, 71, 0.4)',
            lineColor: 'rgba(255, 255, 255, 0.2)',
            secondaryColor: 'rgba(255, 255, 255, 0.05)',
            tertiaryColor: 'rgba(255, 255, 255, 0.03)',
            background: '#060918',
            mainBkg: 'rgba(255, 255, 255, 0.03)',
            nodeBorder: 'rgba(119, 255, 71, 0.3)',
            clusterBkg: 'rgba(255, 255, 255, 0.03)',
            clusterBorder: 'rgba(255, 255, 255, 0.08)',
            titleColor: '#e5e5e5',
            edgeLabelBackground: 'rgba(6, 9, 24, 0.8)',
          },
        });

        const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`;
        const { svg: rendered } = await mermaid.render(id, chart.trim());
        if (!cancelled) setSvg(rendered);
      } catch {
        if (!cancelled) setError(true);
      }
    }

    render();
    return () => { cancelled = true; };
  }, [chart]);

  if (error) {
    return (
      <pre className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 overflow-x-auto mb-6 text-sm text-muted-foreground">
        <code>{chart}</code>
      </pre>
    );
  }

  if (!svg) {
    return (
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 mb-6 animate-pulse h-32" />
    );
  }

  return (
    <div
      ref={ref}
      className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 mb-6 overflow-x-auto [&_svg]:max-w-full [&_svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
