import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, FileText, PenTool, Plus, Search, X } from 'lucide-react';
import type { Note } from '@orqelis/shared';
import { cn, getCategoryColor } from '@/shared/utils';
import { t, type Language } from '@/shared/i18n';

interface LinkedNotesPanelProps {
  title: string;
  noteId: string | null;
  links: string[];
  notes: Note[];
  language: Language;
  onOpenNote: (title: string) => void;
  onClose: () => void;
  /** When provided (diagrams), notes can be searched and inserted as [[links]] */
  onInsertLink?: (title: string) => void;
}

const normalize = (value: string) => value.trim().toLowerCase();

function NoteRow({ note, title, onClick, trailing }: { note?: Note; title: string; onClick: () => void; trailing?: React.ReactNode }) {
  const Icon = note?.type === 'diagram' ? PenTool : FileText;
  return (
    <div className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-on-surface/5">
      <button onClick={onClick} disabled={!note} className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:opacity-50">
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', note ? getCategoryColor(note.category) : 'bg-on-surface/20')} />
        <Icon className="h-3.5 w-3.5 shrink-0 text-on-surface-variant" />
        <span className="truncate text-sm text-on-surface group-hover:text-primary">{title}</span>
      </button>
      {trailing}
    </div>
  );
}

/** Outgoing [[links]] and backlinks of a note, reusing the title-based link model. */
export function LinkedNotesPanel({ title, noteId, links, notes, language, onOpenNote, onClose, onInsertLink }: LinkedNotesPanelProps) {
  const [query, setQuery] = useState('');

  const byTitle = useMemo(() => new Map(notes.map((note) => [normalize(note.title), note])), [notes]);
  const outgoing = useMemo(() => Array.from(new Set(links)), [links]);
  const backlinks = useMemo(
    () => notes.filter((note) => note.id !== noteId && note.links.some((link) => normalize(link) === normalize(title))),
    [notes, noteId, title],
  );
  const candidates = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];
    return notes
      .filter((note) => note.id !== noteId && normalize(note.title).includes(q))
      .slice(0, 8);
  }, [notes, noteId, query]);

  return (
    <aside className="flex h-full w-full flex-col border-l border-on-surface/5 bg-surface-container-lowest">
      <div className="flex items-center justify-between border-b border-on-surface/5 px-4 py-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t('linkedNotes', language)}</h3>
        <button onClick={onClose} className="rounded-lg p-1 text-on-surface-variant hover:bg-on-surface/5">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-3 custom-scrollbar">
        {onInsertLink && (
          <section className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-on-surface-variant" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('searchNotesToLink', language)}
                className="w-full rounded-lg border border-on-surface/10 bg-on-surface/5 py-2 pl-8 pr-3 text-sm outline-none focus:border-primary/40"
              />
            </div>
            {candidates.map((note) => (
              <NoteRow
                key={note.id}
                note={note}
                title={note.title}
                onClick={() => onOpenNote(note.title)}
                trailing={
                  <button
                    onClick={() => {
                      onInsertLink(note.title);
                      setQuery('');
                    }}
                    title={t('insertLink', language)}
                    className="shrink-0 rounded-md p-1 text-primary hover:bg-primary/10"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                }
              />
            ))}
            <p className="px-1 text-[11px] leading-relaxed text-on-surface-variant/60">{t('diagramLinkHint', language)}</p>
          </section>
        )}

        <section>
          <h4 className="mb-1 flex items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">
            <ArrowUpRight className="h-3 w-3" /> {t('outgoingLinks', language)} ({outgoing.length})
          </h4>
          {outgoing.length === 0 ? (
            <p className="px-2 py-1 text-xs text-on-surface-variant/50">{t('noLinksYet', language)}</p>
          ) : (
            outgoing.map((link) => (
              <NoteRow key={link} note={byTitle.get(normalize(link))} title={link} onClick={() => onOpenNote(link)} />
            ))
          )}
        </section>

        <section>
          <h4 className="mb-1 flex items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">
            <ArrowDownLeft className="h-3 w-3" /> {t('backlinks', language)} ({backlinks.length})
          </h4>
          {backlinks.length === 0 ? (
            <p className="px-2 py-1 text-xs text-on-surface-variant/50">{t('noLinksYet', language)}</p>
          ) : (
            backlinks.map((note) => (
              <NoteRow key={note.id} note={note} title={note.title} onClick={() => onOpenNote(note.title)} />
            ))
          )}
        </section>
      </div>
    </aside>
  );
}
