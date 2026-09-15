import { useEffect, useRef, useState } from 'react';
import { exportToSvg } from '@excalidraw/excalidraw';
import type { Note } from '@orqelis/shared';
import { PenTool } from 'lucide-react';
import { cn } from '@/shared/utils';
import { loadSceneFiles, parseDiagramData } from './diagramScene';

interface DiagramPreviewProps {
  note: Pick<Note, 'id' | 'diagramData'>;
  theme: 'dark' | 'light';
  /** Thumbnails skip font inlining to stay light; embeds keep full fidelity */
  variant?: 'thumbnail' | 'embed';
  className?: string;
  errorLabel?: string;
  /** Keeps the last rendered SVG (e.g. while the diagram is being edited in a modal) */
  frozen?: boolean;
}

/** Renders a diagram note as SVG once it scrolls into view. */
export default function DiagramPreview({ note, theme, variant = 'thumbnail', className, errorLabel, frozen = false }: DiagramPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ready' | 'empty' | 'error'>('idle');

  useEffect(() => {
    const node = containerRef.current;
    if (!node || isVisible) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || (frozen && status !== 'idle')) return;
    let cancelled = false;

    const render = async () => {
      const scene = parseDiagramData(note.diagramData);
      const elements = scene.elements.filter((element) => !element.isDeleted);
      if (elements.length === 0) {
        setStatus('empty');
        return;
      }

      const files = await loadSceneFiles(note.id, scene);
      const svg = await exportToSvg({
        elements,
        appState: {
          ...scene.appState,
          exportBackground: false,
          exportWithDarkMode: theme === 'dark',
        },
        files: Object.fromEntries(files.map((file) => [file.id, file])),
        exportPadding: variant === 'embed' ? 16 : 8,
        ...(variant === 'thumbnail' ? { skipInliningFonts: true as const } : {}),
      });
      if (cancelled || !containerRef.current) return;

      svg.removeAttribute('width');
      svg.removeAttribute('height');
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svg.style.width = '100%';
      svg.style.height = '100%';
      containerRef.current.replaceChildren(svg);
      setStatus('ready');
    };

    render().catch((error) => {
      console.error('Diagram preview failed:', error);
      if (!cancelled) setStatus('error');
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, note.id, frozen ? null : note.diagramData, theme, variant]);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div ref={containerRef} className="h-full w-full" />
      {status !== 'ready' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-on-surface-variant/40">
          <PenTool className={cn('w-6 h-6', status === 'idle' && 'animate-pulse')} />
          {status === 'error' && errorLabel && <span className="text-xs">{errorLabel}</span>}
        </div>
      )}
    </div>
  );
}
