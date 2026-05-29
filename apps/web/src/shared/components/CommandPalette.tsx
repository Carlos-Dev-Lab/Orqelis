import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  FileText, 
  Code2, 
  Share2, 
  Terminal, 
  Settings,
  ArrowRight,
  X,
  Star
} from 'lucide-react';
import { cn } from '@/shared/utils';
import { useAppStore } from '@/shared/store';
import { t } from '@/shared/i18n';

interface CommandItem {
  id: string;
  type: 'note' | 'snippet' | 'action' | 'navigation';
  title: string;
  description?: string;
  icon: typeof FileText;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette() {
  const { 
    commandPaletteOpen, 
    setCommandPaletteOpen,
    notes,
    snippets,
    setCurrentView,
    setActiveNoteId,
    language,
  } = useAppStore();
  
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build command list
  const commands: CommandItem[] = [
    // Navigation
    { id: 'nav-dashboard', type: 'navigation', title: t('goDashboard', language), icon: Share2, action: () => setCurrentView('dashboard'), keywords: ['home', 'overview'] },
    { id: 'nav-editor', type: 'navigation', title: t('goNotes', language), icon: FileText, action: () => setCurrentView('editor'), keywords: ['notes', 'write'] },
    { id: 'nav-graph', type: 'navigation', title: t('goGraph', language), icon: Share2, action: () => setCurrentView('graph'), keywords: ['graph', 'connections', 'map'] },
    { id: 'nav-snippets', type: 'navigation', title: t('goSnippets', language), icon: Code2, action: () => setCurrentView('snippets'), keywords: ['code', 'snippets'] },
    { id: 'nav-console', type: 'navigation', title: t('goConsole', language), icon: Terminal, action: () => setCurrentView('console'), keywords: ['terminal', 'console', 'command'] },
    { id: 'nav-settings', type: 'navigation', title: t('goSettings', language), icon: Settings, action: () => setCurrentView('settings'), keywords: ['settings', 'preferences'] },
    
    // Actions
    { id: 'action-new-note', type: 'action', title: t('createNewNote', language), icon: FileText, action: () => { setActiveNoteId(null); setCurrentView('editor'); }, keywords: ['new', 'create', 'note'] },
    
    // Notes
    ...notes.map(note => ({
      id: `note-${note.id}`,
      type: 'note' as const,
      title: note.title,
      description: note.category,
      icon: note.isFavorite ? Star : FileText,
      action: () => { setActiveNoteId(note.id); setCurrentView('editor'); },
      keywords: [...note.tags, ...note.technologies, note.category],
    })),
    
    // Snippets
    ...snippets.map(snippet => ({
      id: `snippet-${snippet.id}`,
      type: 'snippet' as const,
      title: snippet.title,
      description: snippet.language,
      icon: Code2,
      action: () => setCurrentView('snippets'),
      keywords: [...snippet.tags, snippet.language, snippet.framework || ''],
    })),
  ];

  // Filter commands
  const filteredCommands = query.trim() === '' 
    ? commands.slice(0, 8)
    : commands.filter(cmd => {
        const searchText = [cmd.title, cmd.description, ...(cmd.keywords || [])].join(' ').toLowerCase();
        return query.toLowerCase().split(' ').every(term => searchText.includes(term));
      }).slice(0, 10);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!commandPaletteOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            setCommandPaletteOpen(false);
          }
          break;
        case 'Escape':
          setCommandPaletteOpen(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, filteredCommands, selectedIndex, setCommandPaletteOpen]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'note': return 'text-cyan-400 bg-cyan-500/10';
      case 'snippet': return 'text-purple-400 bg-purple-500/10';
      case 'action': return 'text-emerald-400 bg-emerald-500/10';
      case 'navigation': return 'text-blue-400 bg-blue-500/10';
      default: return 'text-on-surface-variant bg-on-surface/10';
    }
  };

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCommandPaletteOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-[101]"
          >
            <div className="mx-4 bg-surface-container-lowest rounded-2xl overflow-hidden shadow-2xl border border-on-surface/10">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-on-surface/10">
                <Search className="w-5 h-5 text-on-surface-variant shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('searchPlaceholder', language)}
                  className="flex-1 bg-transparent border-none outline-none text-on-surface placeholder:text-on-surface-variant/50"
                />
                <button 
                  onClick={() => setCommandPaletteOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-on-surface/10 text-on-surface-variant"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {filteredCommands.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <p className="text-on-surface-variant">{t('noResults', language)} &ldquo;{query}&rdquo;</p>
                  </div>
                ) : (
                  <div className="py-2">
                    {filteredCommands.map((cmd, index) => (
                      <button
                        key={cmd.id}
                        onClick={() => {
                          cmd.action();
                          setCommandPaletteOpen(false);
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={cn(
                          "w-full flex items-center gap-4 px-5 py-3 text-left transition-colors",
                          index === selectedIndex ? "bg-on-surface/10" : "hover:bg-on-surface/5"
                        )}
                      >
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", getTypeColor(cmd.type))}>
                          <cmd.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-on-surface truncate">{cmd.title}</p>
                          {cmd.description && (
                            <p className="text-xs text-on-surface-variant truncate">{cmd.description}</p>
                          )}
                        </div>
                        <div className={cn(
                          "text-[10px] font-mono uppercase px-2 py-1 rounded",
                          getTypeColor(cmd.type)
                        )}>
                          {cmd.type}
                        </div>
                        {index === selectedIndex && (
                          <ArrowRight className="w-4 h-4 text-on-surface-variant shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-on-surface/10 flex items-center justify-between text-xs text-on-surface-variant">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-on-surface/10 font-mono">↑↓</kbd>
                    {t('navigate', language)}
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-on-surface/10 font-mono">↵</kbd>
                    {t('select', language)}
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-on-surface/10 font-mono">esc</kbd>
                    {t('close', language)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
