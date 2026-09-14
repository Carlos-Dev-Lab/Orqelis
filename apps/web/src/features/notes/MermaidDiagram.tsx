import { useEffect, useId, useRef, useState } from 'react';
import type { Language } from '@/shared/i18n';

interface MermaidDiagramProps {
  chart: string;
  theme: 'dark' | 'light';
  language: Language;
}

export function MermaidDiagram({ chart, theme, language }: MermaidDiagramProps) {
  const reactId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const container = containerRef.current;
    if (!container) return;

    const styles = getComputedStyle(document.documentElement);
    const color = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
    const id = `mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

    setError(false);
    container.replaceChildren();
    void import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        themeVariables: {
          darkMode: theme === 'dark',
          background: color('--surface-container-lowest', theme === 'dark' ? '#080f1e' : '#ffffff'),
          primaryColor: color('--surface-container', theme === 'dark' ? '#141c30' : '#f1f5f9'),
          primaryTextColor: color('--on-surface', theme === 'dark' ? '#e2e8f0' : '#0f172a'),
          primaryBorderColor: color('--primary', '#22d3ee'),
          lineColor: color('--on-surface-variant', theme === 'dark' ? '#94a3b8' : '#475569'),
          secondaryColor: color('--surface-container-high', theme === 'dark' ? '#1a2438' : '#e2e8f0'),
          tertiaryColor: color('--surface-container-low', theme === 'dark' ? '#111827' : '#f8fafc'),
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        },
      });
      return mermaid.render(id, chart);
    }).then(({ svg, bindFunctions }) => {
      if (!active || !containerRef.current) return;
      containerRef.current.innerHTML = svg;
      bindFunctions?.(containerRef.current);
    }).catch(() => {
      if (active) setError(true);
    });

    return () => {
      active = false;
      container.replaceChildren();
    };
  }, [chart, reactId, theme]);

  if (error) {
    return (
      <div role="alert" className="my-6 rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-error">
        {language === 'es' ? 'No se pudo representar el diagrama. Revisa la sintaxis Mermaid.' : 'The diagram could not be rendered. Check the Mermaid syntax.'}
      </div>
    );
  }

  return (
    <div ref={containerRef}
      className="mermaid-diagram my-6 overflow-x-auto rounded-xl border border-on-surface/10 bg-surface-container-low p-4"
      aria-label={language === 'es' ? 'Diagrama Mermaid' : 'Mermaid diagram'} />
  );
}
