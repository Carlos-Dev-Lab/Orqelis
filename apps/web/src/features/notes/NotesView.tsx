import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star,
  Plus,
  FileText,
  Search,
  X,
  Layers,
  LayoutGrid,
  List as ListIcon,
} from 'lucide-react';
import { cn, formatDate, getCategoryColor } from '@/shared/utils';
import { useAppStore } from '@/shared/store';
import { t } from '@/shared/i18n';
import { NoteModal } from './NoteModal';
import { Tooltip } from '@/shared/components/Tooltip';

export function NotesView() {
  const {
    notes,
    groups,
    activeGroupId,
    setActiveGroupId,
    activeNoteId,
    setActiveNoteId,
    language,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (activeNoteId) {
      setIsModalOpen(true);
    }
  }, [activeNoteId]);

  const filteredNotes = useMemo(() => {
    let result = activeGroupId ? notes.filter((n) => n.groupId === activeGroupId) : notes;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n => 
        n.title.toLowerCase().includes(q) || 
        n.content.toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    
    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [notes, activeGroupId, searchQuery]);

  const activeGroup = useMemo(
    () => groups.find((g) => g.id === activeGroupId) ?? null,
    [groups, activeGroupId]
  );

  const handleOpenNote = (id: string | null) => {
    setActiveNoteId(id);
    setIsModalOpen(true);
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="px-6 py-6 border-b border-on-surface/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-on-surface">{t('notes', language)}</h1>
              <p className="text-sm text-on-surface-variant">
                {filteredNotes.length} {t('notesSaved', language)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenNote(null)}
              className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
            >
              <Plus className="w-5 h-5" />
              {t('newNote', language)}
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchNotesPlaceholder', language)}
              className="w-full pl-11 pr-4 py-3 bg-on-surface/5 border border-on-surface/10 rounded-2xl outline-none focus:border-primary/30 transition-all text-sm"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex bg-on-surface/5 p-1 rounded-xl border border-on-surface/10">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'grid' ? "bg-surface-container-highest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'list' ? "bg-surface-container-highest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>

            {activeGroupId && (
              <Tooltip content={activeGroup?.name} color={activeGroup?.color}>
                <button
                  onClick={() => setActiveGroupId(null)}
                  className="flex items-center gap-2 px-4 py-3 bg-primary/10 text-primary rounded-2xl border border-primary/20 text-sm font-medium max-w-[200px]"
                >
                  <Layers className="w-4 h-4 shrink-0" style={{ color: activeGroup?.color }} />
                  <span className="truncate">{activeGroup?.name}</span>
                  <X className="w-4 h-4 ml-1 shrink-0" />
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {filteredNotes.length > 0 ? (
          <div className={cn(
            "grid gap-6",
            viewMode === 'grid' 
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" 
              : "grid-cols-1"
          )}>
            <AnimatePresence mode="popLayout">
              {filteredNotes.map((note) => (
                <motion.button
                  key={note.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => handleOpenNote(note.id)}
                  className={cn(
                    "group text-left flex flex-col glass-card rounded-3xl border border-on-surface/5 hover:border-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 p-6 relative overflow-hidden",
                    viewMode === 'list' && "flex-row items-center gap-6 py-4"
                  )}
                >
                  {/* Category Accent */}
                  <div 
                    className={cn("absolute top-0 left-0 w-1 h-full opacity-40 group-hover:opacity-100 transition-opacity", getCategoryColor(note.category))} 
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Tooltip content={note.title}>
                        <h3 className="font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                          {note.title}
                        </h3>
                      </Tooltip>
                      {note.isFavorite && (
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                      )}
                    </div>
                    
                    <p className={cn(
                      "text-sm text-on-surface-variant/70 mb-4 line-clamp-3 leading-relaxed",
                      viewMode === 'list' && "mb-0 line-clamp-1"
                    )}>
                      {note.content}
                    </p>

                    <div className="flex items-center gap-3 mt-auto">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-on-surface-variant/50 uppercase tracking-widest">
                        <span className={cn("w-2 h-2 rounded-full", getCategoryColor(note.category))} />
                        {t(note.category as any, language)}
                      </div>
                      <span className="w-1 h-1 rounded-full bg-on-surface/10" />
                      <span className="text-[10px] font-mono text-on-surface-variant/50 uppercase tracking-widest">
                        {formatDate(note.updatedAt, language)}
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-12">
            <div className="w-24 h-24 rounded-full bg-on-surface/5 flex items-center justify-center mb-6">
              <FileText className="w-10 h-10 text-on-surface-variant/20" />
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">{t('noNotesFound', language)}</h3>
            <p className="text-on-surface-variant max-w-md mx-auto mb-8">
              {searchQuery ? t('noNotesMatchSearch', language) : t('noNotesYet', language)}
            </p>
            {!searchQuery && (
              <button
                onClick={() => handleOpenNote(null)}
                className="px-8 py-3 bg-primary text-on-primary rounded-2xl font-bold hover:scale-[1.05] active:scale-[0.95] transition-all shadow-xl shadow-primary/20"
              >
                {t('createFirstNote', language)}
              </button>
            )}
          </div>
        )}
      </div>

      <NoteModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setActiveNoteId(null);
        }} 
        noteId={activeNoteId} 
      />
    </div>
  );
}

export default NotesView;
