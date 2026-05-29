import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Code2, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  Search, 
  Filter, 
  X, 
  Clock, 
  TrendingUp, 
  Maximize2
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn, formatDate } from '@/shared/utils';
import { useAppStore } from '@/shared/store';
import { t, type Language } from '@/shared/i18n';
import type { Snippet } from '@orqelis/shared';
import { SnippetModal } from './SnippetModal';
import { Tooltip } from '@/shared/components/Tooltip';


function SnippetsView() {
  const {
    snippets,
    deleteSnippet,
    incrementSnippetUsage,
    activeSnippetId,
    setActiveSnippetId,
    language,
  } = useAppStore();

  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterLanguage, setFilterLanguage] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (activeSnippetId) {
      setIsModalOpen(true);
    }
  }, [activeSnippetId]);
  
  // Handlers
  const handleSearch = useCallback((query: string) => {
    setDebouncedSearch(query);
  }, []);

  // Filtered snippets
  const filteredSnippets = useMemo(() => {
    let result = [...snippets];
    
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(s => 
        s.title.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.tags.some(t => t.includes(query)) ||
        s.code.toLowerCase().includes(query)
      );
    }
    
    if (filterLanguage) {
      result = result.filter(s => s.language === filterLanguage);
    }
    
    return result;
  }, [snippets, debouncedSearch, filterLanguage]);

  const handleOpenSnippet = (id: string | null) => {
    setActiveSnippetId(id);
    setIsModalOpen(true);
  };

  const handleCopy = async (snippet: Snippet) => {
    await navigator.clipboard.writeText(snippet.code);
    setCopiedId(snippet.id);
    await incrementSnippetUsage(snippet.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    useAppStore.getState().showConfirm(
      t('confirm', language),
      t('deleteSnippetConfirm', language),
      async () => {
        await deleteSnippet(id);
      }
    );
  };

  const languageStats = useMemo(() => {
    const stats: Record<string, number> = {};
    snippets.forEach(s => {
      stats[s.language] = (stats[s.language] || 0) + 1;
    });
    return Object.entries(stats).sort(([, a], [, b]) => b - a);
  }, [snippets]);

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden">
      <header className="px-6 py-4 border-b border-on-surface/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="font-semibold text-on-surface">{t('codeSnippets', language)}</h1>
              <p className="text-xs text-on-surface-variant">{snippets.length} {t('snippetsSaved', language)}</p>
            </div>
          </div>

          <button
            onClick={() => handleOpenSnippet(null)}
            className="btn-glow px-4 py-2 bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 text-primary font-medium rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('newSnippet', language)}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <SearchBar 
            onSearch={handleSearch} 
            placeholder={t('searchSnippets', language)}
            initialValue={debouncedSearch}
          />
          
          <div className="relative w-full sm:w-auto flex justify-end">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-2.5 rounded-lg border transition-colors",
                filterLanguage 
                  ? "bg-primary/20 border-primary/30 text-primary" 
                  : "bg-on-surface/5 border-on-surface/10 text-on-surface-variant hover:bg-on-surface/10"
              )}
            >
              <Filter className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-12 glass-panel rounded-xl p-4 z-50 min-w-[200px]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-on-surface text-sm">{t('filterLanguage', language)}</h4>
                    <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-on-surface/10 rounded">
                      <X className="w-4 h-4 text-on-surface-variant" />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => { setFilterLanguage(null); setShowFilters(false); }}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg text-left text-sm transition-colors",
                      !filterLanguage ? "bg-primary/20 text-primary" : "hover:bg-on-surface/10 text-on-surface-variant"
                    )}
                  >
                    {t('allLanguages', language)}
                  </button>
                  
                  {languageStats.map(([lang, count]) => (
                    <button
                      key={lang}
                      onClick={() => { setFilterLanguage(lang); setShowFilters(false); }}
                      className={cn(
                        "w-full px-3 py-2 rounded-lg text-left text-sm transition-colors flex items-center justify-between",
                        filterLanguage === lang ? "bg-primary/20 text-primary" : "hover:bg-on-surface/10 text-on-surface-variant"
                      )}
                    >
                      <span>{lang}</span>
                      <span className="text-xs opacity-60">{count}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredSnippets.map((snippet) => (
            <SnippetCard
              key={snippet.id}
              snippet={snippet}
              onOpen={handleOpenSnippet}
              onCopy={handleCopy}
              onDelete={handleDelete}
              isCopied={copiedId === snippet.id}
              language={language}
            />
          ))}
        </div>

        {filteredSnippets.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Code2 className="w-16 h-16 text-on-surface-variant/20 mb-4" />
            <h3 className="text-lg font-semibold text-on-surface-variant mb-2">{t('noSnippetsFound', language)}</h3>
            <p className="text-sm text-on-surface-variant/60 mb-4">
              {debouncedSearch || filterLanguage 
                ? t('adjustSearch', language)
                : t('startLibrary', language)}
            </p>
            <button
              onClick={() => handleOpenSnippet(null)}
              className="px-4 py-2 bg-primary/20 text-primary rounded-lg text-sm font-medium hover:bg-primary/30 transition-colors"
            >
              {t('createFirstSnippet', language)}
            </button>
          </div>
        )}
      </div>

      <SnippetModal 
        isOpen={isModalOpen}
        snippetId={activeSnippetId}
        onClose={() => {
          setIsModalOpen(false);
          setActiveSnippetId(null);
        }}
      />
    </div>
  );
}

const SnippetCard = memo(({ 
  snippet, 
  onOpen, 
  onCopy, 
  onDelete, 
  isCopied, 
  language 
}: { 
  snippet: Snippet; 
  onOpen: (id: string) => void; 
  onCopy: (s: Snippet) => void; 
  onDelete: (id: string) => void; 
  isCopied: boolean;
  language: Language;
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onOpen(snippet.id)}
      className="group glass-card rounded-xl overflow-hidden cursor-pointer hover:border-primary/30 transition-all duration-300"
    >
      <div className="px-4 py-3 border-b border-on-surface/5 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <span className="px-2 py-1 rounded-md bg-on-surface/10 text-xs font-mono text-on-surface-variant shrink-0">
            {snippet.language}
          </span>
          <Tooltip content={snippet.title}>
            <h3 className="font-semibold text-on-surface truncate group-hover:text-primary transition-colors">{snippet.title}</h3>
          </Tooltip>
        </div>
        
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onOpen(snippet.id); }}
            className="p-2 rounded-lg hover:bg-on-surface/10 text-on-surface-variant transition-colors"
            title={t('edit', language)}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onCopy(snippet); }}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isCopied ? "bg-success/20 text-success" : "hover:bg-on-surface/10 text-on-surface-variant"
            )}
            title={t('copy', language)}
          >
            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(snippet.id); }}
            className="p-2 rounded-lg hover:bg-error/20 text-on-surface-variant hover:text-error transition-colors"
            title={t('delete', language)}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-h-[160px] overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
        <SyntaxHighlighter
          style={oneDark}
          language={snippet.language}
          customStyle={{ 
            margin: 0, 
            background: 'transparent',
            fontSize: '11px',
            padding: '16px',
            overflow: 'hidden'
          }}
        >
          {snippet.code}
        </SyntaxHighlighter>
      </div>

      <div className="px-4 py-3 border-t border-on-surface/5 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {snippet.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs text-on-surface-variant bg-on-surface/5 px-2 py-0.5 rounded">
              #{tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs text-on-surface-variant/60 font-mono">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {snippet.usageCount}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(snippet.updatedAt, language)}
          </span>
        </div>
      </div>
    </motion.div>
  );
});


export default SnippetsView;

const SearchBar = memo(({ onSearch, placeholder, initialValue }: { 
  onSearch: (val: string) => void; 
  placeholder: string;
  initialValue: string;
}) => {
  const [localValue, setLocalValue] = useState(initialValue);
  
  useEffect(() => {
    setLocalValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(localValue);
    }, 600); // 600ms debounce
    return () => clearTimeout(timer);
  }, [localValue, onSearch]);

  return (
    <div className="flex-1 relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-on-surface/5 border border-on-surface/10 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary/50 focus:outline-none transition-colors"
      />
    </div>
  );
});
