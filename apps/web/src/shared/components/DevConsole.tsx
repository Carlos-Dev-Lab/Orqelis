import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, 
  ChevronRight, 
  Trash2, 
  FileText,
  Code2,
  Share2
} from 'lucide-react';
import { cn, formatDate } from '@/shared/utils';
import { useAppStore } from '@/shared/store';
import { t } from '@/shared/i18n';

interface CommandOutput {
  id: string;
  type: 'command' | 'output' | 'error' | 'success' | 'info';
  content: string;
  timestamp: Date;
}

function DevConsole() {
  const {
    notes,
    snippets,
    workspaces,
    recentActivity,
    setActiveNoteId,
    setCurrentView,
    createNote,
    deleteNote,
    toggleNoteFavorite,
    setTheme,
    addNotification,
    switchWorkspace,
    activeWorkspaceId,
    language,
  } = useAppStore();

  const [input, setInput] = useState('');
  const [history, setHistory] = useState<CommandOutput[]>([]);

  // Initialize welcome message
  useEffect(() => {
    setHistory([
      {
        id: '0',
        type: 'info',
        content: `
╔════════════════════════════════════════════════════════════╗
║                    ORQELIS CONSOLE                        ║
║            Technical Knowledge Command Center              ║
╚════════════════════════════════════════════════════════════╝

${t('consoleWelcome', language)}
${t('consoleHelpCmd', language)}

`,
        timestamp: new Date(),
      },
    ]);
  }, [language]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addOutput = (type: CommandOutput['type'], content: string) => {
    setHistory(prev => [...prev, {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
    }]);
  };

  const executeCommand = useCallback(async (cmd: string) => {
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return;

    // Add command to output
    addOutput('command', `$ ${trimmedCmd}`);
    
    // Add to command history
    setCommandHistory(prev => [trimmedCmd, ...prev.slice(0, 49)]);
    setHistoryIndex(-1);

    const parts = trimmedCmd.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    try {
      switch (command) {
        case 'help':
          addOutput('info', `
${t('availableCommands', language)}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${t('navigation', language)}:
  dashboard           Go to dashboard view
  notes               Go to notes editor
  graph               Go to knowledge graph
  snippets            Go to snippets library
  settings            Go to settings

${t('noteOperations', language)}:
  list [category]     List all notes (optionally by category)
  search <query>      Search notes by title/content
  open <title>        Open a note by title
  new <title>         Create a new note
  delete <title>      Delete a note
  favorite <title>    Toggle favorite status
  links <title>       Show incoming/outgoing links for a note
  inspect <title>     Show detailed properties of a note
  orphans             List notes without any links

${t('systemCustomization', language)}:
  tutorial [topic]    Show guide (topics: notes, snippets, graph, console)
  theme <light|dark>  Change interface theme
  workspace <name>    Switch to another workspace
  notify <msg>        Send a test notification
  stats               Show knowledge base statistics
  activity            Show recent activity
  clear               Clear console output
  whoami              Show current user info

${t('data', language)}:
  export              Export data as JSON
  help                Show this help message

${t('tips', language)}:
  - ${t('tabAutocomplete', language)}
  - ${t('upDownHistory', language)}
`);
          break;

        case 'tutorial':
          const topic = args[0]?.toLowerCase();
          let tutorialContent = '';
          const tutorialTitle = t('tutorialTitle', language);

          if (topic === 'notes') {
            tutorialContent = t('tutorialNotes', language);
          } else if (topic === 'snippets') {
            tutorialContent = t('tutorialSnippets', language);
          } else if (topic === 'graph') {
            tutorialContent = t('tutorialGraph', language);
          } else if (topic === 'console') {
            tutorialContent = t('tutorialConsole', language);
          } else if (topic === 'styles') {
            tutorialContent = t('tutorialStyles', language);
          } else {
            tutorialContent = t('tutorialIndex', language);
          }

          addOutput('info', `
╔══════════════════════════════════════════════════════════╗
║        ${tutorialTitle.padEnd(50)}║
╚══════════════════════════════════════════════════════════╝

${tutorialContent}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
          break;

        case 'theme':
          const newTheme = args[0]?.toLowerCase();
          if (newTheme === 'light' || newTheme === 'dark') {
            setTheme(newTheme);
            addOutput('success', `${t('themeChanged', language)} ${newTheme}`);
          } else {
            addOutput('error', 'Usage: theme <light|dark>');
          }
          break;

        case 'workspace':
          const wsName = args.join(' ').toLowerCase();
          if (!wsName) {
            const wsList = workspaces.map(w => `  - ${w.name} ${w.id === activeWorkspaceId ? '(active)' : ''}`).join('\n');
            addOutput('info', `${t('availableWorkspaces', language)}:\n${wsList}\n\nUsage: workspace <name>`);
            break;
          }
          const targetWs = workspaces.find(w => w.name.toLowerCase().includes(wsName));
          if (targetWs) {
            await switchWorkspace(targetWs.id);
            addOutput('success', `${t('switchedToWorkspace', language)}: ${targetWs.name}`);
          } else {
            addOutput('error', `${t('workspaceNotFound', language)}: "${wsName}"`);
          }
          break;

        case 'notify':
          const msg = args.join(' ');
          if (!msg) {
            addOutput('error', 'Usage: notify <message>');
            break;
          }
          await addNotification({
            title: 'Console Notification',
            message: msg,
            type: 'info'
          });
          addOutput('success', t('notificationSent', language));
          break;

        case 'whoami':
            addOutput('output', `
User: Dev
Role: Administrator
Environment: Orqelis v1.0.0
Last Login: ${new Date().toLocaleString()}
Active Workspace: ${workspaces.find(w => w.id === activeWorkspaceId)?.name || 'None'}
`);
          break;

        case 'date':
          addOutput('output', new Date().toString());
          break;

        case 'settings':
          setCurrentView('settings');
          addOutput('success', `${t('navigatedTo', language)} Settings`);
          break;

        case 'clear':
          setHistory([]);
          addOutput('info', t('consoleCleared', language));
          break;

        case 'dashboard':
          setCurrentView('dashboard');
          addOutput('success', `${t('navigatedTo', language)} Dashboard`);
          break;

        case 'notes':
          setCurrentView('editor');
          addOutput('success', `${t('navigatedTo', language)} Notes Editor`);
          break;

        case 'graph':
          setCurrentView('graph');
          addOutput('success', `${t('navigatedTo', language)} Knowledge Graph`);
          break;

        case 'snippets':
          setCurrentView('snippets');
          addOutput('success', `${t('navigatedTo', language)} Snippets Library`);
          break;

        case 'list':
          const category = args[0]?.toLowerCase();
          const filteredNotes = category 
            ? notes.filter(n => n.category === category)
            : notes;
          
          if (filteredNotes.length === 0) {
            addOutput('info', category 
              ? `${t('noNotesInCategory', language)}: ${category}`
              : `${t('noNotesFound', language)}. ${t('createFirstNoteWith', language)}: new <title>`
            );
          } else {
            const noteList = filteredNotes.map(n => 
              `  ${n.isFavorite ? '★' : '○'} [${n.category.padEnd(12)}] ${n.title} (${n.links.length} links)`
            ).join('\n');
            addOutput('output', `${t('foundNotes', language)} ${filteredNotes.length}:\n\n${noteList}`);
          }
          break;

        case 'search':
          const query = args.join(' ').toLowerCase();
          if (!query) {
            addOutput('error', 'Usage: search <query>');
            break;
          }
          
          const results = notes.filter(n => 
            n.title.toLowerCase().includes(query) ||
            n.content.toLowerCase().includes(query) ||
            n.tags.some(t => t.includes(query))
          );
          
          if (results.length === 0) {
            addOutput('info', `${t('noResults', language)}: "${query}"`);
          } else {
            const resultList = results.map(n => 
              `  • ${n.title} [${n.category}] - ${n.content.slice(0, 50)}...`
            ).join('\n');
            addOutput('success', `${t('foundResultsFor', language)} "${query}":\n\n${resultList}`);
          }
          break;

        case 'open':
          const titleToOpen = args.join(' ');
          if (!titleToOpen) {
            addOutput('error', 'Usage: open <title>');
            break;
          }
          
          const noteToOpen = notes.find(n => 
            n.title.toLowerCase() === titleToOpen.toLowerCase()
          );
          
          if (noteToOpen) {
            setActiveNoteId(noteToOpen.id);
            setCurrentView('editor');
            addOutput('success', `${t('openedNote', language)}: ${noteToOpen.title}`);
          } else {
            addOutput('error', `${t('noteNotFound', language)}: "${titleToOpen}"\nTip: Use 'list' to see all notes.`);
          }
          break;

        case 'new':
          const newTitle = args.join(' ') || 'Untitled Note';
          const newNote = await createNote({ title: newTitle });
          setActiveNoteId(newNote.id);
          addOutput('success', `${t('createdNewNote', language)}: ${newTitle}`);
          break;

        case 'delete':
          const titleToDelete = args.join(' ');
          if (!titleToDelete) {
            addOutput('error', 'Usage: delete <title>');
            break;
          }
          
          const noteToDelete = notes.find(n => 
            n.title.toLowerCase() === titleToDelete.toLowerCase()
          );
          
          if (noteToDelete) {
            await deleteNote(noteToDelete.id);
            addOutput('success', `${t('deletedNote', language)}: ${noteToDelete.title}`);
          } else {
            addOutput('error', `${t('noteNotFound', language)}: "${titleToDelete}"`);
          }
          break;

        case 'favorite':
          const titleToFavorite = args.join(' ');
          if (!titleToFavorite) {
            addOutput('error', 'Usage: favorite <title>');
            break;
          }
          
          const noteToFavorite = notes.find(n => 
            n.title.toLowerCase() === titleToFavorite.toLowerCase()
          );
          
          if (noteToFavorite) {
            await toggleNoteFavorite(noteToFavorite.id);
            addOutput('success', `${t('toggledFavorite', language)}: ${noteToFavorite.title}`);
          } else {
            addOutput('error', `${t('noteNotFound', language)}: "${titleToFavorite}"`);
          }
          break;

        case 'stats':
          const totalNotes = notes.length;
          const totalSnippets = snippets.length;
          const totalLinks = notes.reduce((acc, n) => acc + n.links.length, 0);
          const favorites = notes.filter(n => n.isFavorite).length;
          const categories: Record<string, number> = {};
          notes.forEach(n => {
            categories[n.category] = (categories[n.category] || 0) + 1;
          });
          
          const catStats = Object.entries(categories)
            .map(([cat, count]) => `    ${cat.padEnd(15)} ${count}`)
            .join('\n');
          
          addOutput('output', `
╔═══════════════════════════════════════╗
║         ${t('knowledgeBaseStats', language).padEnd(30)}║
╠═══════════════════════════════════════╣
║  Total Notes:      ${totalNotes.toString().padStart(6)}           ║
║  Total Snippets:   ${totalSnippets.toString().padStart(6)}           ║
║  Total Links:      ${totalLinks.toString().padStart(6)}           ║
║  Favorites:        ${favorites.toString().padStart(6)}           ║
╠═══════════════════════════════════════╣
║  ${t('byCategory', language).padEnd(37)}║
${catStats ? catStats.split('\n').map(l => '║  ' + l.padEnd(37) + '║').join('\n') : '║  (no notes yet)                      ║'}
╚═══════════════════════════════════════╝
`);
          break;

        case 'inspect':
          const inspectTitle = args.join(' ');
          if (!inspectTitle) {
            addOutput('error', 'Usage: inspect <title|name>');
            break;
          }
          const itemToInspect = notes.find(n => n.title.toLowerCase() === inspectTitle.toLowerCase()) ||
                               snippets.find(s => s.title.toLowerCase() === inspectTitle.toLowerCase()) ||
                               groups.find(g => g.name.toLowerCase() === inspectTitle.toLowerCase());

          if (itemToInspect) {
            const isNote = 'content' in itemToInspect;
            const isSnippet = 'code' in itemToInspect;
            const isGroup = 'color' in itemToInspect && !isNote;

            addOutput('output', `
// PROPERTY_INSPECTOR v1.0
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> uuid          : ${itemToInspect.id}
> type          : ${isNote ? 'note' : isSnippet ? 'snippet' : 'group'}
> name/title    : ${'title' in itemToInspect ? itemToInspect.title : (itemToInspect as any).name}
${isNote ? `> category      : ${(itemToInspect as any).category}` : ''}
${isSnippet ? `> language      : ${(itemToInspect as any).language}` : ''}
> group_id      : ${(itemToInspect as any).groupId || 'null'}
${'tags' in itemToInspect ? `> tags          : [${(itemToInspect as any).tags.join(', ')}]` : ''}
> created_at    : ${new Date(itemToInspect.createdAt).toISOString()}
> updated_at    : ${new Date(itemToInspect.updatedAt).toISOString()}
${isNote ? `> links_out     : ${(itemToInspect as any).links.length}` : ''}
${isNote ? `> snippet_ids   : [${(itemToInspect as any).snippetIds?.join(', ') || ''}]` : ''}
${isGroup ? `> color         : ${(itemToInspect as any).color}` : ''}
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
          } else {
            addOutput('error', `Element not found: "${inspectTitle}"`);
          }
          break;

        case 'links':
          const titleForLinks = args.join(' ');
          if (!titleForLinks) {
            addOutput('error', 'Usage: links <title>');
            break;
          }
          
          const noteForLinks = notes.find(n => 
            n.title.toLowerCase() === titleForLinks.toLowerCase()
          );
          
          if (noteForLinks) {
            const outgoing = noteForLinks.links;
            const incoming = notes
              .filter(n => n.links.some(l => l.toLowerCase() === noteForLinks.title.toLowerCase()))
              .map(n => n.title);
            
            addOutput('output', `
${t('linksFor', language)}: ${noteForLinks.title}

  ${t('outgoing', language)} (${outgoing.length}):
${outgoing.map(l => `    → ${l}`).join('\n') || '    (none)'}

  ${t('incoming', language)} (${incoming.length}):
${incoming.map(l => `    ← ${l}`).join('\n') || '    (none)'}
`);
          } else {
            addOutput('error', `${t('noteNotFound', language)}: "${titleForLinks}"`);
          }
          break;

        case 'orphans':
          const orphanNotes = notes.filter(n => n.links.length === 0);
          if (orphanNotes.length === 0) {
            addOutput('success', t('noOrphanNotes', language));
          } else {
            const orphanList = orphanNotes.map(n => `  • ${n.title} [${n.category}]`).join('\n');
            addOutput('info', `${t('foundOrphanNotes', language)}:\n\n${orphanList}\n\n${t('addLinksTip', language)}`);
          }
          break;

        case 'activity':
          if (recentActivity.length === 0) {
            addOutput('info', t('noRecentActivity', language));
          } else {
            const activityList = recentActivity.slice(0, 10).map(a => 
              `  [${formatDate(a.timestamp, language)}] ${a.type.toUpperCase()} - ${a.entityTitle}`
            ).join('\n');
            addOutput('output', `${t('recentActivity', language)}:\n\n${activityList}`);
          }
          break;

        case 'export':
          const exportData = {
            notes,
            snippets,
            exportedAt: new Date().toISOString(),
          };
          const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `orqelis-export-${Date.now()}.json`;
          a.click();
          URL.revokeObjectURL(url);
          addOutput('success', t('exportSuccess', language));
          break;

        default:
          addOutput('error', `${t('unknownCommand', language)}: ${command}\nType 'help' for available commands.`);
      }
    } catch (error) {
      addOutput('error', `Error executing command: ${error}`);
    }
  }, [notes, snippets, recentActivity, setCurrentView, setActiveNoteId, createNote, deleteNote, toggleNoteFavorite]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple autocomplete for commands
      const commands = ['help', 'clear', 'dashboard', 'notes', 'graph', 'snippets', 'list', 'search', 'open', 'new', 'delete', 'favorite', 'stats', 'links', 'orphans', 'activity', 'export', 'tutorial', 'theme', 'workspace', 'notify', 'whoami', 'date', 'settings'];
      const match = commands.find(c => c.startsWith(input.toLowerCase()));
      if (match) {
        setInput(match);
      }
    }
  };

  const getOutputColor = (type: CommandOutput['type']) => {
    switch (type) {
      case 'command': return 'text-primary';
      case 'error': return 'text-error';
      case 'success': return 'text-success';
      case 'info': return 'text-on-surface-variant';
      default: return 'text-on-surface';
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-surface-container-lowest">
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center">
            <Terminal className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="font-semibold text-on-surface">{t('consoleHeader', language)}</h1>
            <p className="text-xs text-on-surface-variant font-mono">orqelis v1.0.0</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-4 text-xs font-mono text-on-surface-variant mr-4">
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              {notes.length} {t('notes', language).toLowerCase()}
            </span>
            <span className="flex items-center gap-1.5">
              <Code2 className="w-4 h-4" />
              {snippets.length} {t('snippets', language).toLowerCase()}
            </span>
            <span className="flex items-center gap-1.5">
              <Share2 className="w-4 h-4" />
              {notes.reduce((acc, n) => acc + n.links.length, 0)} {t('links', language).toLowerCase()}
            </span>
          </div>
          <button
            onClick={() => setHistory([])}
            className="p-2 rounded-lg hover:bg-white/5 text-on-surface-variant transition-colors"
            title={t('consoleCleared', language)}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Console Output */}
      <div 
        ref={outputRef}
        className="flex-1 overflow-y-auto p-6 font-mono text-sm custom-scrollbar"
        onClick={() => inputRef.current?.focus()}
      >
        <AnimatePresence>
          {history.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("whitespace-pre-wrap mb-2", getOutputColor(item.type))}
            >
              {item.content}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-white/5 bg-surface-container-lowest/50">
        <div className="flex items-center gap-3">
          <ChevronRight className="w-5 h-5 text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('searchPlaceholder', language)}
            className="flex-1 bg-transparent border-none outline-none text-on-surface font-mono placeholder:text-on-surface-variant/40"
            spellCheck={false}
            autoComplete="off"
          />
          <div className="hidden sm:flex items-center gap-2 text-xs text-on-surface-variant/60">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">Tab</kbd>
            <span>{t('tabAutocomplete', language).split(' ').pop()}</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">↑↓</kbd>
            <span>{t('upDownHistory', language).split(' ').pop()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DevConsole;
