import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Code2, 
  Star, 
  Clock, 
  TrendingUp, 
  Plus,
  ArrowRight,
  Share2,
  Zap,
  Activity,
  Laptop
} from 'lucide-react';
import { cn, formatDate, getCategoryColor } from '@/shared/utils';
import { useAppStore } from '@/shared/store';
import { t } from '@/shared/i18n';
import { SnippetModal } from '@/features/snippets/SnippetModal';

export function Dashboard() {
  const { 
    notes, 
    snippets, 
    connections,
    workspaces,
    activeWorkspaceId,
    setCurrentView, 
    setActiveNoteId,
    language,
    setWorkspaceManagerOpen,
  } = useAppStore();

  const [activeSnippetId, setActiveSnippetId] = useState<string | null>(null);
  const [isSnippetModalOpen, setIsSnippetModalOpen] = useState(false);

  if (workspaces.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-background/50 relative overflow-hidden">
        <div className="aurora-bg opacity-20" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full glass-card p-10 text-center relative z-10 border-primary/20 shadow-2xl shadow-primary/10"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-8 text-primary shadow-inner">
            <Share2 className="w-10 h-10 animate-pulse" />
          </div>
          
          <h1 className="text-3xl font-bold text-on-surface mb-4 tracking-tight">
            Welcome to Orqelis
          </h1>
          
          <p className="text-on-surface-variant mb-10 leading-relaxed">
            To start organizing your technical knowledge, you first need to create a workspace. A workspace is your container for notes, snippets, and connections.
          </p>

          <div className="space-y-4">
            <button 
              onClick={() => setWorkspaceManagerOpen(true)}
              className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-3"
            >
              <Plus className="w-5 h-5" />
              Create Your First Workspace
            </button>
            
            <p className="text-[10px] text-on-surface-variant/50 uppercase font-mono tracking-widest pt-4">
              Tip: You can have up to 5 workspaces
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const favoriteNotes = notes.filter(n => n.isFavorite);
  const recentNotes = notes.slice(0, 6);
  const topSnippets = snippets.sort((a, b) => b.usageCount - a.usageCount).slice(0, 4);
  
  // Technology stats
  const techCounts = notes.reduce((acc, note) => {
    note.technologies.forEach(tech => {
      acc[tech] = (acc[tech] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);
  
  const topTechs = Object.entries(techCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Orphan notes (no links)
  const orphanNotes = notes.filter(n => n.links.length === 0);

  const handleOpenSnippet = (id: string) => {
    setActiveSnippetId(id);
    setIsSnippetModalOpen(true);
  };

  return (
    <div className="p-6 lg:p-8 h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          {activeWorkspace && (
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: activeWorkspace.color }} 
              />
              <span className="text-xs font-bold font-mono text-on-surface-variant uppercase tracking-widest">
                {activeWorkspace.name}
              </span>
            </div>
          )}
          <h1 className="text-3xl font-bold text-on-surface mb-2">{t('dashboardTitle', language)}</h1>
          <p className="text-on-surface-variant">{t('dashboardSub', language)}</p>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: t('totalNotes', language), value: notes.length, icon: FileText, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
            { label: t('totalSnippets', language), value: snippets.length, icon: Code2, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { label: t('connectionsAndAccess', language), value: connections.length, icon: Laptop, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: t('links', language), value: notes.reduce((acc, n) => acc + n.links.length, 0), icon: Share2, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
            { label: t('favorites', language), value: favoriteNotes.length, icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "glass-card rounded-xl p-5 min-w-0",
                i === 4 && "sm:col-span-2 lg:col-span-1"
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", stat.bg)}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
              </div>
              <p className="text-2xl font-bold text-on-surface truncate">{stat.value}</p>
              <p className="text-sm text-on-surface-variant truncate" title={stat.label}>{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Notes */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-on-surface-variant" />
                  <h2 className="text-lg font-semibold text-on-surface">{t('recentNotes', language)}</h2>
                </div>
                <button 
                  onClick={() => setCurrentView('editor')}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  {t('viewAll', language)} <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentNotes.map((note, i) => (
                  <motion.button
                    key={note.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => {
                      setActiveNoteId(note.id);
                      setCurrentView('editor');
                    }}
                    className="p-4 rounded-xl bg-on-surface/5 border border-on-surface/5 hover:border-primary/30 hover:bg-on-surface/10 transition-all text-left group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className={cn("w-2 h-2 rounded-full mt-2", getCategoryColor(note.category))} />
                      {note.isFavorite && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                    </div>
                    <h3 className="font-semibold text-on-surface mb-1 group-hover:text-primary transition-colors">
                      {note.title}
                    </h3>
                    <p className="text-xs text-on-surface-variant line-clamp-2 mb-3">
                      {note.content.slice(0, 100)}...
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-on-surface-variant/60 font-mono">
                      <span>{formatDate(note.updatedAt, language)}</span>
                      <span className="w-1 h-1 rounded-full bg-on-surface/20" />
                      <span>{note.links.length} {t('links', language)}</span>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* New Note Button */}
              <button
                onClick={() => {
                  setActiveNoteId(null);
                  setCurrentView('editor');
                }}
                className="mt-4 w-full p-4 rounded-xl border-2 border-dashed border-on-surface/10 hover:border-primary/30 text-on-surface-variant hover:text-primary transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>{t('newNote', language)}</span>
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Technologies */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-on-surface-variant" />
                <h2 className="text-lg font-semibold text-on-surface">{t('topTechs', language)}</h2>
              </div>
              
              <div className="space-y-3">
                {topTechs.map(([tech, count]) => (
                  <div key={tech} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <span className="text-sm font-medium text-on-surface truncate" title={tech}>{tech}</span>
                        <span className="text-xs text-on-surface-variant shrink-0">{count} {t('notes', language)}</span>
                      </div>
                      <div className="h-1.5 bg-on-surface/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
                          style={{ width: `${(count / notes.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {topTechs.length === 0 && (
                  <p className="text-sm text-on-surface-variant text-center py-4">
                    {t('noTechs', language)}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-5 h-5 text-on-surface-variant" />
                <h2 className="text-lg font-semibold text-on-surface">{t('quickActions', language)}</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t('newNote', language), icon: FileText, view: 'editor' as const, action: () => setActiveNoteId(null) },
                  { label: t('graphView', language), icon: Share2, view: 'graph' as const },
                  { label: t('snippets', language), icon: Code2, view: 'snippets' as const },
                  { label: t('devConsole', language), icon: Activity, view: 'console' as const },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => {
                      action.action?.();
                      setCurrentView(action.view);
                    }}
                    className="p-3 rounded-lg bg-on-surface/5 border border-on-surface/10 hover:border-primary/30 hover:bg-on-surface/10 transition-all flex flex-col items-center gap-2 text-on-surface-variant hover:text-primary"
                  >
                    <action.icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Orphan Notes Warning */}
            {orphanNotes.length > 0 && (
              <div className="glass-card rounded-xl p-6 border-warning/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                    <Share2 className="w-4 h-4 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-on-surface">{t('orphanNotes', language)}</h3>
                    <p className="text-xs text-on-surface-variant">{orphanNotes.length} {t('orphanSub', language)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {orphanNotes.slice(0, 3).map(note => (
                    <button
                      key={note.id}
                      onClick={() => {
                        setActiveNoteId(note.id);
                        setCurrentView('editor');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg bg-on-surface/5 text-sm text-on-surface-variant hover:text-on-surface hover:bg-on-surface/10 transition-all truncate"
                    >
                      {note.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Snippets */}
        {topSnippets.length > 0 && (
          <div className="mt-6">
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Code2 className="w-5 h-5 text-on-surface-variant" />
                  <h2 className="text-lg font-semibold text-on-surface">{t('popularSnippets', language)}</h2>
                </div>
                <button 
                  onClick={() => setCurrentView('snippets')}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  {t('viewAll', language)} <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {topSnippets.map((snippet) => (
                  <button
                    key={snippet.id}
                    onClick={() => handleOpenSnippet(snippet.id)}
                    className="p-4 rounded-xl bg-surface-container-lowest border border-on-surface/5 hover:border-primary/30 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-on-surface/10 text-on-surface-variant">
                        {snippet.language}
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        {snippet.usageCount} {t('uses', language)}
                      </span>
                    </div>
                    <h3 className="font-medium text-on-surface mb-1 truncate group-hover:text-primary transition-colors">{snippet.title}</h3>
                    <p className="text-xs text-on-surface-variant line-clamp-2">{snippet.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <SnippetModal
        isOpen={isSnippetModalOpen}
        onClose={() => setIsSnippetModalOpen(false)}
        snippetId={activeSnippetId}
      />
    </div>
  );
}
