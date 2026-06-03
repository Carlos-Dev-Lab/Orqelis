import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star,
  Tag,
  Eye,
  Edit3,
  X,
  ChevronDown,
  Code2,
  Layers,
  Maximize2,
  Minimize2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn, extractBidirectionalLinks, getCategoryColor } from '@/shared/utils';
import { useAppStore } from '@/shared/store';
import { t } from '@/shared/i18n';
import type { Note } from '@orqelis/shared';
import { SnippetModal } from '@/features/snippets/SnippetModal';

const categories: Note['category'][] = ['frontend', 'backend', 'database', 'infrastructure', 'devops', 'docs'];

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string | null;
}

export function NoteModal({ isOpen, onClose, noteId }: NoteModalProps) {
  const {
    notes,
    snippets,
    groups,
    setActiveNoteId,
    createNote,
    updateNote,
    deleteNote,
    toggleNoteFavorite,
    assignNoteToGroup,
    theme,
    language,
  } = useAppStore();

  // Modo por defecto: visualización (preview)
  const [isPreview, setIsPreview] = useState(true);
  const [localContent, setLocalContent] = useState('');
  const [localTitle, setLocalTitle] = useState('');
  const [localCategory, setLocalCategory] = useState<Note['category']>('docs');
  const [localTags, setLocalTags] = useState<string[]>([]);
  const [localSnippetIds, setLocalSnippetIds] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeSnippetId, setActiveSnippetId] = useState<string | null>(null);
  const [isSnippetModalOpen, setIsSnippetModalOpen] = useState(false);
  
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastNoteIdRef = useRef<string | null>(null);

  const activeNote = useMemo(() => 
    notes.find(n => n.id === noteId),
    [notes, noteId]
  );

  // Initialize local state when note changes or modal opens
  useEffect(() => {
    if (isOpen) {
      // Si el noteId cambia o es una nota diferente a la última cargada
      if (noteId !== lastNoteIdRef.current || (activeNote && !localTitle && !localContent)) {
        if (activeNote) {
          setLocalContent(activeNote.content);
          setLocalTitle(activeNote.title);
          setLocalCategory(activeNote.category);
          setLocalTags(activeNote.tags);
          setLocalSnippetIds(activeNote.snippetIds || []);
          setIsPreview(true);
          lastNoteIdRef.current = noteId;
        } else if (!noteId) {
          setLocalContent('');
          setLocalTitle('');
          setLocalCategory('docs');
          setLocalTags([]);
          setLocalSnippetIds([]);
          setIsPreview(false);
          lastNoteIdRef.current = null;
        }
        setHasUnsavedChanges(false);
      }
    } else {
      lastNoteIdRef.current = null;
    }
  }, [isOpen, noteId, activeNote, localTitle, localContent]);

  // Auto-save with debounce
  const saveNote = useCallback(async () => {
    if (!localTitle.trim() && !localContent.trim()) return;

    // Resetear el flag antes del guardado para capturar cambios que ocurran durante el proceso
    setHasUnsavedChanges(false);

    const links = extractBidirectionalLinks(localContent);

    try {
      if (noteId && activeNote) {
        await updateNote(noteId, {
          title: localTitle || 'Untitled',
          content: localContent,
          category: localCategory,
          tags: localTags,
          links,
          snippetIds: localSnippetIds,
        });
      } else if (isOpen) {
        const newNote = await createNote({
          title: localTitle || 'Untitled',
          content: localContent,
          category: localCategory,
          tags: localTags,
          links,
          snippetIds: localSnippetIds,
          groupId: useAppStore.getState().activeGroupId ?? null,
        });
        setActiveNoteId(newNote.id);
        lastNoteIdRef.current = newNote.id;
      }
    } catch (error) {
      console.error('Error saving note:', error);
      setHasUnsavedChanges(true);
    }
  }, [noteId, activeNote, localTitle, localContent, localCategory, localTags, localSnippetIds, updateNote, createNote, setActiveNoteId, isOpen]);

  // Auto-save on changes
  useEffect(() => {
    if (hasUnsavedChanges) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(saveNote, 1200);
    }
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [hasUnsavedChanges, saveNote]);

  const handleContentChange = (value: string | undefined) => {
    setLocalContent(value || '');
    setHasUnsavedChanges(true);
  };

  const handleTitleChange = (value: string) => {
    setLocalTitle(value);
    setHasUnsavedChanges(true);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !localTags.includes(newTag.trim().toLowerCase())) {
      setLocalTags([...localTags, newTag.trim().toLowerCase()]);
      setNewTag('');
      setHasUnsavedChanges(true);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setLocalTags(localTags.filter(t => t !== tag));
    setHasUnsavedChanges(true);
  };


  const handleOpenSnippet = (id: string) => {
    setActiveSnippetId(id);
    setIsSnippetModalOpen(true);
  };

  const handleNoteDelete = async () => {
    if (!noteId) return;
    useAppStore.getState().showConfirm(
      t('confirm', language),
      t('deleteNoteConfirm', language),
      async () => {
        await deleteNote(noteId);
        onClose();
      }
    );
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      saveNote();
    }
    onClose();
  };

  // Extract detected links for display

  const contentWithInternalLinks = useMemo(() => {
    return localContent.replace(/\[\[([^\]]+)\]\]/g, '[$1](#internal-link)');
  }, [localContent]);

  const handleInternalLinkClick = useCallback((title: string) => {
    const targetNote = notes.find(n => n.title.toLowerCase() === title.toLowerCase());
    if (targetNote) {
      setActiveNoteId(targetNote.id);
    }
  }, [notes, setActiveNoteId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 md:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-background/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={cn(
              "relative flex flex-col bg-surface-container-lowest border border-on-surface/10 shadow-2xl overflow-hidden transition-all duration-300",
              isFullScreen ? "w-full h-full rounded-none" : "w-full max-w-5xl h-[95vh] sm:h-[90vh] rounded-none sm:rounded-3xl"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <header className="px-4 sm:px-6 py-3 sm:py-4 border-b border-on-surface/5 flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <input
                  type="text"
                  value={localTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder={t('noteTitlePlaceholder', language)}
                  className="flex-1 min-w-0 text-lg sm:text-xl font-bold bg-transparent border-none outline-none text-on-surface placeholder:text-on-surface-variant/40"
                />
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <div className="hidden sm:flex items-center gap-2 mr-4 text-[10px] font-mono uppercase tracking-widest">
                  {hasUnsavedChanges ? (
                    <span className="text-warning flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                      {t('unsaved', language)}
                    </span>
                  ) : (
                    <span className="text-success flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-success" />
                      {t('saved', language)}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setIsPreview(!isPreview)}
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    isPreview ? "bg-primary/20 text-primary" : "hover:bg-on-surface/5 text-on-surface-variant"
                  )}
                  title={isPreview ? t('editMode', language) : t('previewMode', language)}
                >
                  {isPreview ? <Edit3 className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="hidden sm:flex p-2 rounded-xl hover:bg-on-surface/5 text-on-surface-variant transition-all"
                >
                  {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>

                {noteId && (
                  <button
                    onClick={() => toggleNoteFavorite(noteId)}
                    className={cn(
                      "p-2 rounded-xl transition-all",
                      activeNote?.isFavorite ? "text-amber-400" : "hover:bg-on-surface/5 text-on-surface-variant"
                    )}
                  >
                    <Star className={cn("w-5 h-5", activeNote?.isFavorite && "fill-amber-400")} />
                  </button>
                )}

                <div className="w-px h-6 bg-on-surface/10 mx-1" />

                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl hover:bg-error/10 hover:text-error text-on-surface-variant transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </header>

            {/* Metadata Bar */}
            <div className="relative z-30 px-4 sm:px-6 py-2 sm:py-3 border-b border-on-surface/5 flex items-center gap-3 shrink-0">
               {/* Category Dropdown */}
               <div className="relative shrink-0">
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-on-surface/5 border border-on-surface/10 hover:border-on-surface/20 transition-all text-sm"
                >
                  <span className={cn("w-2 h-2 rounded-full", getCategoryColor(localCategory))} />
                  <span className="text-on-surface font-medium whitespace-nowrap">{t(localCategory as any, language)}</span>
                  <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                </button>

                <AnimatePresence>
                  {showCategoryDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-2 w-40 py-1 glass-panel rounded-xl z-[110] shadow-2xl border border-on-surface/10"
                    >
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            setLocalCategory(cat);
                            setShowCategoryDropdown(false);
                            setHasUnsavedChanges(true);
                          }}
                          className={cn(
                            "w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-on-surface/10 transition-colors text-sm",
                            localCategory === cat && "bg-on-surface/10"
                          )}
                        >
                          <span className={cn("w-2 h-2 rounded-full", getCategoryColor(cat))} />
                          <span className="text-on-surface">{t(cat as any, language)}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Group Dropdown */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-on-surface/5 border border-on-surface/10 hover:border-on-surface/20 transition-all text-sm"
                >
                  <Layers className="w-3.5 h-3.5 text-on-surface-variant" />
                  {(() => {
                    const currentGroup = groups.find((g) => g.id === activeNote?.groupId);
                    return currentGroup ? (
                      <span className="text-on-surface font-medium whitespace-nowrap">{currentGroup.name}</span>
                    ) : (
                      <span className="text-on-surface-variant">{t('noGroup', language)}</span>
                    );
                  })()}
                  <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                </button>

                <AnimatePresence>
                  {showGroupDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-2 w-52 py-1 glass-panel rounded-xl z-[110] shadow-2xl border border-on-surface/10 max-h-72 overflow-y-auto custom-scrollbar"
                    >
                      <button
                        onClick={async () => {
                          if (noteId) await assignNoteToGroup(noteId, null);
                          setShowGroupDropdown(false);
                        }}
                        disabled={!noteId}
                        className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-on-surface/10 transition-colors text-sm"
                      >
                        <X className="w-3 h-3 text-on-surface-variant" />
                        <span className="text-on-surface-variant">{t('noGroup', language)}</span>
                      </button>
                      {groups.map((g) => (
                        <button
                          key={g.id}
                          onClick={async () => {
                            if (noteId) await assignNoteToGroup(noteId, g.id);
                            setShowGroupDropdown(false);
                          }}
                          disabled={!noteId}
                          className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-on-surface/10 transition-colors text-sm"
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                          <span className="text-on-surface">{g.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tags */}
              <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <div className="h-6 w-px bg-on-surface/10 mx-1 shrink-0" />
                <Tag className="w-4 h-4 text-on-surface-variant shrink-0" />
                <div className="flex items-center gap-1.5 flex-nowrap">
                  {localTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-on-surface/5 text-[10px] font-bold text-on-surface-variant border border-on-surface/10"
                    >
                      #{tag}
                      <button onClick={() => handleRemoveTag(tag)} className="hover:text-error transition-colors">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-1 min-w-[80px]">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                      placeholder={t('addTag', language)}
                      className="w-20 px-2 py-1 bg-transparent border-none outline-none text-xs text-on-surface-variant placeholder:text-on-surface-variant/30"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Editor Content */}
            <div className="relative z-10 flex-1 overflow-hidden bg-surface-container-lowest">
              {isPreview ? (
                <div className="h-full overflow-y-auto custom-scrollbar p-6 sm:p-10">
                  <article className="prose prose-cyan dark:prose-invert max-w-none text-on-surface">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeSanitize]}
                      components={{
                        code({ node, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          const inline = !match;
                          return !inline ? (
                            <SyntaxHighlighter
                              style={oneDark}
                              language={match[1]}
                              PreTag="div"
                              className="rounded-2xl !bg-on-surface/5 !border !border-on-surface/5 !my-6"
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className="px-1.5 py-0.5 rounded-lg bg-on-surface/5 text-primary font-mono text-sm" {...props}>
                              {children}
                            </code>
                          );
                        },
                        p({ children }) {
                          return <p className="leading-relaxed mb-4 last:mb-0">{children}</p>;
                        },
                        a({ children, href, ...props }) {
                          if (href === '#internal-link') {
                            return (
                              <button
                                onClick={() => handleInternalLinkClick(String(children))}
                                className="text-primary hover:underline font-bold bg-primary/5 px-1.5 py-0.5 rounded-lg transition-all"
                              >
                                [[{children}]]
                              </button>
                            );
                          }
                          return (
                            <a 
                              href={href} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-primary hover:underline font-medium"
                              {...props}
                            >
                              {children}
                            </a>
                          );
                        },
                        h1: ({ children }) => <h1 className="text-3xl font-bold mb-6 mt-8 text-on-surface border-b border-on-surface/10 pb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-2xl font-bold mb-4 mt-8 text-on-surface">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-xl font-bold mb-3 mt-6 text-on-surface">{children}</h3>,
                        ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
                        li: ({ children }) => <li className="text-on-surface-variant">{children}</li>,
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-primary/30 pl-4 italic my-6 text-on-surface-variant bg-on-surface/5 py-2 pr-4 rounded-r-lg">
                            {children}
                          </blockquote>
                        ),
                      }}
                    >
                      {contentWithInternalLinks || `*${t('noContentYet', language)}*`}
                    </ReactMarkdown>

                    {/* Linked Snippets Section */}
                    {localSnippetIds.length > 0 && (
                      <div className="mt-12 pt-8 border-t border-on-surface/5">
                        <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-6 flex items-center gap-2">
                          <Code2 className="w-4 h-4" />
                          {t('relatedSnippets', language)}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {localSnippetIds.map(id => {
                            const snippet = snippets.find(s => s.id === id);
                            if (!snippet) return null;
                            return (
                              <button
                                key={id}
                                onClick={() => handleOpenSnippet(id)}
                                className="group flex flex-col text-left p-4 rounded-2xl bg-on-surface/5 border border-on-surface/5 hover:border-primary/20 hover:bg-on-surface/10 transition-all duration-300"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-mono font-bold text-primary uppercase">{snippet.language}</span>
                                  <Maximize2 className="w-3.5 h-3.5 text-on-surface-variant/40 group-hover:text-primary transition-colors" />
                                </div>
                                <h4 className="font-bold text-on-surface group-hover:text-primary transition-colors truncate">{snippet.title}</h4>
                                {snippet.description && (
                                  <p className="text-xs text-on-surface-variant/60 line-clamp-1 mt-1">{snippet.description}</p>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </article>
                </div>
              ) : (
                <Editor
                  height="100%"
                  defaultLanguage="markdown"
                  value={localContent}
                  onChange={handleContentChange}
                  theme={theme === 'dark' ? 'vs-dark' : 'light'}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 16,
                    fontFamily: "'JetBrains Mono', 'Geist Mono', monospace",
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    renderLineHighlight: 'line',
                    cursorBlinking: 'smooth',
                    smoothScrolling: true,
                    bracketPairColorization: { enabled: true },
                    padding: { top: 32, bottom: 32 },
                  }}
                />
              )}
            </div>

            {/* Footer / Status Bar */}
            <footer className="px-6 py-3 border-t border-on-surface/5 flex items-center justify-between shrink-0 bg-on-surface/5">
              <div className="flex items-center gap-4 text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-widest">
                <span>{localContent.length} {t('characters', language)}</span>
                <span>{localContent.split(/\s+/).filter(Boolean).length} {t('words', language)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleNoteDelete}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-error/10 hover:text-error transition-all"
                >
                  {t('delete', language)}
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
                >
                  {t('saveAndClose', language)}
                </button>
              </div>
            </footer>
          </motion.div>

          <SnippetModal
            isOpen={isSnippetModalOpen}
            onClose={() => setIsSnippetModalOpen(false)}
            snippetId={activeSnippetId}
          />
        </div>
      )}
    </AnimatePresence>
  );
}
