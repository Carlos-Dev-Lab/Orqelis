import { Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, PenTool } from 'lucide-react';
import type { Note } from '@orqelis/shared';
import { t, type Language } from '@/shared/i18n';
import { DiagramPreview } from './index';

const POPOVER_WIDTH = 320;
const POPOVER_HEIGHT = 236;
const OPEN_DELAY = 250;
const CLOSE_DELAY = 150;

interface DiagramLinkChipProps {
  diagram: Note;
  theme: 'dark' | 'light';
  language: Language;
  onOpen: (title: string) => void;
  children: ReactNode;
}

/** [[link]] to a diagram: shows a live preview of the diagram on hover / keyboard focus. */
export function DiagramLinkChip({ diagram, theme, language, onOpen, children }: DiagramLinkChipProps) {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const show = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      const margin = 8;
      const below = rect.bottom + margin + POPOVER_HEIGHT <= window.innerHeight;
      const top = below ? rect.bottom + margin : Math.max(margin, rect.top - margin - POPOVER_HEIGHT);
      const left = Math.min(Math.max(margin, rect.left), window.innerWidth - POPOVER_WIDTH - margin);
      setPosition({ top, left });
    }, OPEN_DELAY);
  }, []);

  const hide = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setPosition(null), CLOSE_DELAY);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // A scrolling note would detach the popover from its link
  useEffect(() => {
    if (!position) return;
    const close = () => setPosition(null);
    window.addEventListener('scroll', close, true);
    return () => window.removeEventListener('scroll', close, true);
  }, [position]);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => onOpen(diagram.title)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="inline-flex items-center gap-1 text-secondary hover:underline font-bold bg-secondary/10 px-1.5 py-0.5 rounded-lg transition-all align-baseline"
      >
        <PenTool className="w-3.5 h-3.5 shrink-0" />
        {children}
      </button>

      {position &&
        createPortal(
          <div
            role="tooltip"
            onMouseEnter={() => clearTimeout(timerRef.current)}
            onMouseLeave={hide}
            style={{ top: position.top, left: position.left, width: POPOVER_WIDTH, height: POPOVER_HEIGHT }}
            className="fixed z-[200] flex flex-col overflow-hidden rounded-2xl border border-on-surface/10 bg-surface-container shadow-2xl"
          >
            <button type="button" onClick={() => onOpen(diagram.title)} className="min-h-0 flex-1 bg-surface-container-lowest p-2">
              <Suspense fallback={null}>
                <DiagramPreview note={diagram} theme={theme} className="h-full w-full" errorLabel={t('diagramLoadError', language)} />
              </Suspense>
            </button>
            <button
              type="button"
              onClick={() => onOpen(diagram.title)}
              className="flex items-center gap-2 border-t border-on-surface/5 px-3 py-2 text-left text-xs text-on-surface-variant hover:text-primary"
            >
              <PenTool className="h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 flex-1 truncate font-medium text-on-surface">{diagram.title}</span>
              <span className="flex shrink-0 items-center gap-0.5">
                {t('openDiagram', language)} <ArrowUpRight className="h-3 w-3" />
              </span>
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}

interface LinkedDiagramsProps {
  diagrams: Note[];
  theme: 'dark' | 'light';
  language: Language;
  onOpen: (title: string) => void;
}

/** Preview cards for the diagrams a note links to. */
export function LinkedDiagrams({ diagrams, theme, language, onOpen }: LinkedDiagramsProps) {
  if (diagrams.length === 0) return null;
  return (
    <div className="not-prose mt-12 pt-8 border-t border-on-surface/5">
      {/* div, not h3: the global .prose heading styles would apply */}
      <div role="heading" aria-level={3} className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-6 flex items-center gap-2">
        <PenTool className="w-4 h-4" />
        {t('linkedDiagrams', language)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {diagrams.map((diagram) => (
          <button
            key={diagram.id}
            type="button"
            onClick={() => onOpen(diagram.title)}
            className="group flex flex-col overflow-hidden rounded-2xl border border-on-surface/5 bg-on-surface/5 text-left transition-all duration-300 hover:border-primary/20 hover:bg-on-surface/10"
          >
            <Suspense fallback={<div className="h-44" />}>
              <DiagramPreview note={diagram} theme={theme} className="h-44 p-2" errorLabel={t('diagramLoadError', language)} />
            </Suspense>
            <div className="flex items-center gap-2 border-t border-on-surface/5 px-4 py-3">
              <PenTool className="h-4 w-4 shrink-0 text-secondary" />
              <span className="min-w-0 flex-1 truncate font-bold text-on-surface group-hover:text-primary transition-colors">{diagram.title}</span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-on-surface-variant/40 group-hover:text-primary transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
