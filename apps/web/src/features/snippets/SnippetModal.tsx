import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Tag,
  Eye,
  Edit3,
  X,
  Plus,
  ChevronDown,
  FileText,
  Code2,
  Layers,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn, formatDate } from '@/shared/utils';
import { useAppStore } from '@/shared/store';
import { t } from '@/shared/i18n';

const languages = [
  'typescript', 'javascript', 'python', 'rust', 'go', 'java', 
  'sql', 'css', 'html', 'bash', 'dockerfile', 'yaml', 'json'
];

interface SnippetModalProps {
  isOpen: boolean;
  onClose: () => void;
  snippetId: string | null;
}

export function SnippetModal({ isOpen, onClose, snippetId }: SnippetModalProps) {
  const {
    snippets,
    notes,
    groups,
    updateSnippet,
    createSnippet,
    deleteSnippet,
    theme,
    language,
    incrementSnippetUsage,
    addNotification,
  } = useAppStore() as any;

  const [isPreview, setIsPreview] = useState(true);
  const [localCode, setLocalCode] = useState('');
  const [localTitle, setLocalTitle] = useState('');
  const [localLanguage, setLocalLanguage] = useState('typescript');
  const [localDescription, setLocalDescription] = useState('');
  const [localTags, setLocalTags] = useState<string[]>([]);
  const [localNoteIds, setLocalNoteIds] = useState<string[]>([]);
  const [localGroupId, setLocalGroupId] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [showNoteDropdown, setShowNoteDropdown] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const activeSnippet = useMemo(() => 
    snippets.find(s => s.id === snippetId),
    [snippets, snippetId]
  );

  // Initialize local state
  useEffect(() => {
    if (isOpen) {
      if (activeSnippet) {
        setLocalCode(activeSnippet.code);
        setLocalTitle(activeSnippet.title);
        setLocalLanguage(activeSnippet.language);
        setLocalDescription(activeSnippet.description || '');
        setLocalTags(activeSnippet.tags || []);
        setLocalNoteIds(activeSnippet.noteIds || []);
        setLocalGroupId(activeSnippet.groupId || null);
        setHasUnsavedChanges(false);
        setIsPreview(true);
      } else {
        setLocalCode('');
        setLocalTitle('');
        setLocalLanguage('typescript');
        setLocalDescription('');
        setLocalTags([]);
        setLocalNoteIds([]);
        setLocalGroupId(useAppStore.getState().activeGroupId ?? null);
        setHasUnsavedChanges(false);
        setIsPreview(false);
      }
    }
  }, [isOpen, activeSnippet]);

  const saveSnippet = useCallback(async () => {
    if (!localTitle.trim() || !localCode.trim()) return;

    if (snippetId && activeSnippet) {
      await updateSnippet(snippetId, {
        title: localTitle,
        code: localCode,
        language: localLanguage,
        description: localDescription,
        tags: localTags,
        noteIds: localNoteIds,
        groupId: localGroupId,
      });
    } else if (isOpen) {
      await createSnippet({
        title: localTitle,
        code: localCode,
        language: localLanguage,
        description: localDescription,
        tags: localTags,
        noteIds: localNoteIds,
        groupId: localGroupId,
      });
      // Logic to set active snippet if needed
    }
    setHasUnsavedChanges(false);
  }, [snippetId, activeSnippet, localTitle, localCode, localLanguage, localDescription, localTags, localNoteIds, localGroupId, updateSnippet, createSnippet, isOpen]);

  // Auto-save
  useEffect(() => {
    if (hasUnsavedChanges) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(saveSnippet, 1500);
    }
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [hasUnsavedChanges, saveSnippet]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(localCode);
    setCopied(true);
    if (snippetId) await incrementSnippetUsage(snippetId);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    // Nuevo comportamiento solicitado: permitir cerrar el modal sin validaciones ni guardado implícito
    onClose();
  };

  const handleSave = async () => {
    // Validar antes de guardar
    const missingTitle = !localTitle.trim();
    const missingCode = !localCode.trim();

    if (missingTitle || missingCode) {
      const msgParts: string[] = [];
      if (missingTitle) msgParts.push(t('snippetTitleRequired', language) ?? 'El título del snippet es obligatorio.');
      if (missingCode) msgParts.push(t('snippetCodeRequired', language) ?? 'El código del snippet es obligatorio.');

      if (typeof addNotification === 'function') {
        addNotification({
          title: t('cannotSave', language) ?? 'No se puede guardar',
          message: msgParts.join(' '),
          type: 'warning',
        });
      } else {
        alert((t('cannotSave', language) ?? 'No se puede guardar') + ': ' + msgParts.join(' '));
      }
      return;
    }

    // Guardar y cerrar
    await saveSnippet();
    if (typeof addNotification === 'function') {
      addNotification({
        title: t('saved', language) ?? 'Guardado',
        message: t('snippetSaved', language) ?? 'Snippet guardado correctamente.',
        type: 'success',
      });
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!snippetId) return;
    useAppStore.getState().showConfirm(
      t('confirm', language),
      t('deleteSnippetConfirm', language),
      async () => {
        await deleteSnippet(snippetId);
        onClose();
      }
    );
  };

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
            {/* Header */}
            <header className="px-4 sm:px-6 py-3 sm:py-4 border-b border-on-surface/5 flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Code2 className="w-5 h-5 text-primary" />
                </div>
                <input
                  type="text"
                  value={localTitle}
                  onChange={(e) => { setLocalTitle(e.target.value); setHasUnsavedChanges(true); }}
                  placeholder={t('title', language)}
                  className="flex-1 min-w-0 text-lg sm:text-xl font-bold bg-transparent border-none outline-none text-on-surface placeholder:text-on-surface-variant/40"
                  required
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
                  onClick={handleCopy}
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    copied ? "bg-success/20 text-success" : "hover:bg-on-surface/5 text-on-surface-variant"
                  )}
                  title={t('copy', language)}
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => setIsPreview(!isPreview)}
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    !isPreview ? "bg-primary/20 text-primary" : "hover:bg-on-surface/5 text-on-surface-variant"
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
               {/* Language Selector */}
               <div className="relative shrink-0">
                <button
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-on-surface/5 border border-on-surface/10 hover:border-on-surface/20 transition-all text-sm"
                >
                  <span className="text-primary font-mono font-bold uppercase text-[10px]">{localLanguage}</span>
                  <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                </button>

                <AnimatePresence>
                  {showLanguageDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-2 w-48 py-1 glass-panel rounded-xl z-[110] shadow-2xl border border-on-surface/10 max-h-64 overflow-y-auto"
                    >
                      {languages.map((lang) => (
                        <button
                          key={lang}
                          onClick={() => {
                            setLocalLanguage(lang);
                            setShowLanguageDropdown(false);
                            setHasUnsavedChanges(true);
                          }}
                          className={cn(
                            "w-full px-4 py-2 text-left flex items-center justify-between hover:bg-on-surface/10 transition-colors text-sm",
                            localLanguage === lang && "bg-on-surface/10 text-primary"
                          )}
                        >
                          <span className="font-mono">{lang}</span>
                          {localLanguage === lang && <Check className="w-3 h-3" />}
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
                    const currentGroup = groups.find((g) => g.id === localGroupId);
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
                        onClick={() => {
                          setLocalGroupId(null);
                          setShowGroupDropdown(false);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-on-surface/10 transition-colors text-sm"
                      >
                        <X className="w-3 h-3 text-on-surface-variant" />
                        <span className="text-on-surface-variant">{t('noGroup', language)}</span>
                      </button>
                      {groups.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => {
                            setLocalGroupId(g.id);
                            setShowGroupDropdown(false);
                            setHasUnsavedChanges(true);
                          }}
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

              {/* Related Notes */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowNoteDropdown(!showNoteDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-on-surface/5 border border-on-surface/10 hover:border-on-surface/20 transition-all text-sm"
                >
                  <FileText className="w-3.5 h-3.5 text-on-surface-variant" />
                  <span className="text-on-surface font-medium whitespace-nowrap">
                    {localNoteIds.length} {t('notes', language)}
                  </span>
                  <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                </button>

                <AnimatePresence>
                  {showNoteDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-2 w-64 py-2 glass-panel rounded-xl z-[110] shadow-2xl border border-on-surface/10 max-h-72 overflow-y-auto custom-scrollbar"
                    >
                      <div className="px-4 py-2 text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest border-b border-on-surface/5 mb-2">
                        {t('relatedNotes', language)}
                      </div>
                      
                      {/* Linked Notes */}
                      {localNoteIds.map(id => {
                        const note = notes.find(n => n.id === id);
                        if (!note) return null;
                        return (
                          <div key={id} className="px-2 py-1 flex items-center gap-1">
                            <button
                              onClick={() => {
                                // Close snippet modal and open note? 
                                // For now just allow removing
                              }}
                              className="flex-1 px-2 py-1.5 rounded-lg hover:bg-on-surface/10 text-xs text-on-surface truncate flex items-center gap-2"
                            >
                              <FileText className="w-3 h-3 text-on-surface-variant" />
                              {note.title}
                            </button>
                            <button 
                              onClick={() => { setLocalNoteIds(localNoteIds.filter(nid => nid !== id)); setHasUnsavedChanges(true); }}
                              className="p-1.5 rounded-lg hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}

                      {localNoteIds.length > 0 && <div className="h-px bg-on-surface/5 my-2" />}

                      {/* Link New Note */}
                      <div className="px-2">
                        <p className="px-3 py-1 text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">
                          {t('linkNote', language)}
                        </p>
                        {notes.filter(n => !localNoteIds.includes(n.id)).map(note => (
                          <button
                            key={note.id}
                            onClick={() => {
                              setLocalNoteIds([...localNoteIds, note.id]);
                              setHasUnsavedChanges(true);
                              setShowNoteDropdown(false);
                            }}
                            className="w-full px-3 py-2 rounded-lg hover:bg-on-surface/10 text-left text-xs text-on-surface-variant truncate flex items-center gap-2"
                          >
                            <Plus className="w-3 h-3" />
                            {note.title}
                          </button>
                        ))}
                      </div>
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
                      <button 
                        onClick={() => { setLocalTags(localTags.filter(t => t !== tag)); setHasUnsavedChanges(true); }} 
                        className="hover:text-error transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-1 min-w-[80px]">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTag.trim()) {
                          if (!localTags.includes(newTag.trim().toLowerCase())) {
                            setLocalTags([...localTags, newTag.trim().toLowerCase()]);
                            setNewTag('');
                            setHasUnsavedChanges(true);
                          }
                        }
                      }}
                      placeholder={t('addTag', language)}
                      className="w-20 px-2 py-1 bg-transparent border-none outline-none text-xs text-on-surface-variant placeholder:text-on-surface-variant/30"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Description Bar (Optional for Snippets) */}
            <div className="relative z-20 px-6 py-2 border-b border-on-surface/5 bg-on-surface/2">
              <textarea
                value={localDescription}
                onChange={(e) => { setLocalDescription(e.target.value); setHasUnsavedChanges(true); }}
                placeholder={t('briefDescription', language)}
                rows={2}
                className="w-full bg-transparent border-none outline-none text-sm text-on-surface-variant placeholder:text-on-surface-variant/30 resize-none py-1 custom-scrollbar"
              />
            </div>

            {/* Content Area */}
            <div className="relative z-10 flex-1 overflow-hidden bg-surface-container-lowest">
              {isPreview ? (
                <div className="h-full overflow-auto custom-scrollbar bg-[#282c34]">
                   <SyntaxHighlighter
                    language={localLanguage}
                    style={oneDark}
                    customStyle={{
                      margin: 0,
                      padding: '2rem',
                      fontSize: '1rem',
                      lineHeight: '1.5',
                      backgroundColor: 'transparent',
                    }}
                    showLineNumbers={true}
                  >
                    {localCode}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <Editor
                  height="100%"
                  language={localLanguage}
                  value={localCode}
                  onChange={(val) => { setLocalCode(val || ''); setHasUnsavedChanges(true); }}
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
                    automaticLayout: true,
                  }}
                />
              )}
            </div>

            {/* Footer */}
            <footer className="px-6 py-3 border-t border-on-surface/5 flex items-center justify-between shrink-0 bg-on-surface/5">
              <div className="flex items-center gap-6 text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-widest">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" />
                  {activeSnippet?.usageCount || 0} {t('uses', language)}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  {activeSnippet ? formatDate(activeSnippet.updatedAt, language) : '-'}
                </span>
                <span>{localCode.length} {t('characters', language)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {snippetId && (
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-error/10 hover:text-error transition-all"
                  >
                    {t('delete', language)}
                  </button>
                )}
                <button
                  onClick={handleSave}
                  className="px-6 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
                >
                  {t('saveAndClose', language)}
                </button>
              </div>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
