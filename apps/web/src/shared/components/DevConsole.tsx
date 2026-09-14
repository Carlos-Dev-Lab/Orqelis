import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, 
  ChevronRight, 
  Trash2, 
  FileText,
  Code2,
  Share2,
  CircleHelp,
  ListTree,
  BarChart3,
  Activity,
  Server,
  CornerDownLeft
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

const COMMANDS = [
  'help', 'clear', 'dashboard', 'notes', 'graph', 'snippets', 'connections',
  'settings', 'list', 'search', 'open', 'new', 'delete', 'confirm', 'cancel',
  'favorite', 'stats', 'status', 'links', 'inspect', 'orphans', 'activity',
  'history', 'categories', 'export', 'tutorial', 'theme', 'workspace', 'notify',
  'whoami', 'date',
] as const;

const parseCommand = (value: string) => {
  const tokens: string[] = [];
  const matcher = /"([^"]*)"|'([^']*)'|([^\s]+)/g;
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(value)) !== null) {
    tokens.push(match[1] ?? match[2] ?? match[3]);
  }

  return tokens;
};

const quoteArgument = (value: string) => /\s/.test(value) ? `"${value.replace(/"/g, '\\"')}"` : value;

const CONSOLE_BOX_DIVIDER = '__ORQELIS_CONSOLE_BOX_DIVIDER__';

const createConsoleBox = (title: string, rows: string[], width: number) => {
  const fit = (value: string) => value.padEnd(width);
  const wrap = (value: string) => {
    if (!value) return [''];

    const wrappedRows: string[] = [];
    let remaining = value;
    while (remaining.length > width) {
      const lastSpace = remaining.lastIndexOf(' ', width);
      const splitAt = lastSpace > 0 ? lastSpace : width;
      wrappedRows.push(remaining.slice(0, splitAt).trimEnd());
      remaining = remaining.slice(splitAt).trimStart();
    }
    wrappedRows.push(remaining);
    return wrappedRows;
  };
  const center = (value: string) => {
    const trimmed = value.slice(0, width);
    const left = Math.floor((width - trimmed.length) / 2);
    return `${' '.repeat(left)}${trimmed}`.padEnd(width);
  };
  const top = `╔${'═'.repeat(width)}╗`;
  const divider = `╠${'═'.repeat(width)}╣`;
  const bottom = `╚${'═'.repeat(width)}╝`;
  const line = (value: string) => `║${fit(value)}║`;

  return [
    top,
    line(center(title)),
    divider,
    ...rows.flatMap((row) =>
      row === CONSOLE_BOX_DIVIDER || /^━+$/.test(row)
        ? [divider]
        : wrap(row).map(line),
    ),
    bottom,
  ].join('\n');
};

function DevConsole() {
  const {
    notes,
    snippets,
    workspaces,
    groups,
    connections,
    recentActivity,
    setActiveNoteId,
    setNoteModalOpen,
    setCurrentView,
    createNote,
    deleteNote,
    toggleNoteFavorite,
    setTheme,
    addNotification,
    switchWorkspace,
    activeWorkspaceId,
    user,
    isServerOnline,
    isDbOnline,
    language,
  } = useAppStore();

  const [input, setInput] = useState('');
  const [history, setHistory] = useState<CommandOutput[]>([]);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null);

  // Initialize welcome message
  useEffect(() => {
    setHistory([
      {
        id: '0',
        type: 'info',
        content: `${createConsoleBox('ORQELIS CONSOLE', ['Technical Knowledge Command Center'], 60)}\n\n${t('consoleWelcome', language)}\n${t('consoleHelpCmd', language)}`,
        timestamp: new Date(),
      },
    ]);
  }, [language]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const outputIdRef = useRef(0);

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
      id: `${Date.now()}-${++outputIdRef.current}`,
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

    const parts = parseCommand(trimmedCmd);
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
  connections         Go to connections & access
  settings            Go to settings

${t('noteOperations', language)}:
  list [type]         List notes, snippets, groups, workspaces or connections
  search <query>      Search notes and snippets
  open <title>        Open a note by title
  new <title>         Create a new note
  delete <title>      Prepare a note deletion (requires confirmation)
  confirm delete      Confirm the prepared deletion
  cancel delete       Cancel the prepared deletion
  favorite <title>    Toggle favorite status
  links <title>       Show incoming/outgoing links for a note
  inspect <title>     Show detailed properties of a note
  orphans             List notes without any links

${t('systemCustomization', language)}:
  tutorial [topic]    Show guide (notes, snippets, graph, console, styles)
  theme <light|dark>  Change interface theme
  workspace <name>    Switch to another workspace
  notify <msg>        Send a test notification
  stats               Show knowledge base statistics
  status              Show service and workspace status
  activity            Show recent activity
  history             Show commands used in this session
  categories          Show available note categories
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

          addOutput('info', `${createConsoleBox(tutorialTitle, tutorialContent.split('\n'), 58)}\n${'━'.repeat(60)}`);
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
User: ${user?.name || user?.email || 'Unknown'}
Email: ${user?.email || 'Unavailable'}
Role: ${user?.role || 'Unknown'}
Environment: Orqelis v1.0.0
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

        case 'connections':
          setCurrentView('connections');
          addOutput('success', `${t('navigatedTo', language)} Connections & Access`);
          break;

        case 'list':
          const listType = args[0]?.toLowerCase() || 'notes';

          if (listType === 'snippets') {
            const rows = snippets.map(s => `  ${s.isFavorite ? '★' : '○'} [${s.language}] ${s.title} (${s.usageCount} uses)`).join('\n');
            addOutput(rows ? 'output' : 'info', rows ? `Snippets (${snippets.length}):\n\n${rows}` : 'No snippets found.');
            break;
          }

          if (listType === 'groups') {
            const rows = groups.map(g => `  • ${g.name}${g.description ? ` — ${g.description}` : ''}`).join('\n');
            addOutput(rows ? 'output' : 'info', rows ? `Groups (${groups.length}):\n\n${rows}` : 'No groups found.');
            break;
          }

          if (listType === 'workspaces') {
            const rows = workspaces.map(w => `  ${w.id === activeWorkspaceId ? '●' : '○'} ${w.name}${w.id === activeWorkspaceId ? ' (active)' : ''}`).join('\n');
            addOutput('output', `Workspaces (${workspaces.length}):\n\n${rows}`);
            break;
          }

          if (listType === 'connections') {
            const rows = connections.map(c => `  • [${c.type}] ${c.name} — ${c.host}${c.port ? `:${c.port}` : ''}`).join('\n');
            addOutput(rows ? 'output' : 'info', rows ? `Connections (${connections.length}):\n\n${rows}` : 'No connections found.');
            break;
          }

          const category = listType === 'notes' ? undefined : listType;
          const filteredNotes = category ? notes.filter(n => n.category === category) : notes;
          
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
          
          const noteResults = notes.filter(n =>
            n.title.toLowerCase().includes(query) ||
            n.content.toLowerCase().includes(query) ||
            n.tags.some(tag => tag.toLowerCase().includes(query))
          );
          const snippetResults = snippets.filter(s =>
            s.title.toLowerCase().includes(query) ||
            s.description.toLowerCase().includes(query) ||
            s.code.toLowerCase().includes(query) ||
            s.tags.some(tag => tag.toLowerCase().includes(query))
          );
          
          if (noteResults.length === 0 && snippetResults.length === 0) {
            addOutput('info', `${t('noResults', language)}: "${query}"`);
          } else {
            const resultList = [
              ...noteResults.map(n => `  • [note/${n.category}] ${n.title} - ${n.content.slice(0, 50)}...`),
              ...snippetResults.map(s => `  • [snippet/${s.language}] ${s.title} - ${s.description.slice(0, 50)}...`),
            ].join('\n');
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
            setNoteModalOpen(true);
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
          setNoteModalOpen(true);
          setCurrentView('editor');
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
            setPendingDelete({ id: noteToDelete.id, title: noteToDelete.title });
            addOutput('info', `Deletion prepared for: ${noteToDelete.title}\nRun 'confirm delete' to continue or 'cancel delete' to keep it.`);
          } else {
            addOutput('error', `${t('noteNotFound', language)}: "${titleToDelete}"`);
          }
          break;

        case 'confirm':
          if (args[0]?.toLowerCase() !== 'delete' || !pendingDelete) {
            addOutput('error', "Nothing to confirm. Run 'delete <title>' first.");
            break;
          }
          await deleteNote(pendingDelete.id);
          addOutput('success', `${t('deletedNote', language)}: ${pendingDelete.title}`);
          setPendingDelete(null);
          break;

        case 'cancel':
          if (args[0]?.toLowerCase() !== 'delete' || !pendingDelete) {
            addOutput('info', 'No prepared deletion to cancel.');
            break;
          }
          addOutput('success', `Deletion cancelled: ${pendingDelete.title}`);
          setPendingDelete(null);
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
          
          const statisticRows = [
            `Total Notes:      ${totalNotes}`,
            `Total Snippets:   ${totalSnippets}`,
            `Total Links:      ${totalLinks}`,
            `Favorites:        ${favorites}`,
            `Groups:           ${groups.length}`,
            `Connections:      ${connections.length}`,
            CONSOLE_BOX_DIVIDER,
            t('byCategory', language),
            ...(catStats ? catStats.split('\n').map((line) => line.trim()) : ['(no notes yet)']),
          ];
          addOutput('output', createConsoleBox(t('knowledgeBaseStats', language), statisticRows, 39));
          break;

        case 'status':
          addOutput(isServerOnline && isDbOnline ? 'success' : 'error', `
ORQELIS STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  API server       ${isServerOnline ? '● online' : '○ offline'}
  Database         ${isDbOnline ? '● connected' : '○ unavailable'}
  Workspace        ${workspaces.find(w => w.id === activeWorkspaceId)?.name || 'None'}
  Notes            ${notes.length}
  Snippets         ${snippets.length}
  Groups           ${groups.length}
  Connections      ${connections.length}
`);
          break;

        case 'history':
          addOutput(commandHistory.length > 1 ? 'output' : 'info', commandHistory.length > 1
            ? `Command history:\n\n${commandHistory.slice(1).map((entry, index) => `  ${(index + 1).toString().padStart(2)}  ${entry}`).join('\n')}`
            : 'No previous commands in this session.');
          break;

        case 'categories':
          addOutput('output', `Available note categories:\n\n  frontend\n  backend\n  database\n  infrastructure\n  devops\n  docs`);
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
  }, [
    notes, snippets, workspaces, groups, connections, recentActivity, activeWorkspaceId,
    user, isServerOnline, isDbOnline, language, commandHistory, pendingDelete,
    setCurrentView, setActiveNoteId, setNoteModalOpen, createNote, deleteNote, toggleNoteFavorite,
    setTheme, addNotification, switchWorkspace,
  ]);

  const suggestions = useMemo(() => {
    const normalized = input.trimStart();
    if (!normalized) return [];

    const firstSpace = normalized.indexOf(' ');
    if (firstSpace === -1) {
      return COMMANDS
        .filter(command => command.startsWith(normalized.toLowerCase()))
        .slice(0, 6)
        .map(command => ({ value: command, label: command, hint: 'command' }));
    }

    const command = normalized.slice(0, firstSpace).toLowerCase();
    const query = normalized.slice(firstSpace + 1).replace(/^["']/, '').toLowerCase();
    let values: Array<{ value: string; label: string; hint: string }> = [];

    if (['open', 'delete', 'favorite', 'links', 'inspect'].includes(command)) {
      values = notes.map(note => ({
        value: `${command} ${quoteArgument(note.title)}`,
        label: note.title,
        hint: note.category,
      }));
    } else if (command === 'workspace') {
      values = workspaces.map(workspace => ({
        value: `workspace ${quoteArgument(workspace.name)}`,
        label: workspace.name,
        hint: workspace.id === activeWorkspaceId ? 'active' : 'workspace',
      }));
    } else if (command === 'tutorial') {
      values = ['notes', 'snippets', 'graph', 'console', 'styles'].map(topic => ({
        value: `tutorial ${topic}`,
        label: topic,
        hint: 'guide',
      }));
    } else if (command === 'theme') {
      values = ['light', 'dark'].map(theme => ({ value: `theme ${theme}`, label: theme, hint: 'theme' }));
    } else if (command === 'list') {
      values = ['notes', 'snippets', 'groups', 'workspaces', 'connections', 'frontend', 'backend', 'database', 'infrastructure', 'devops', 'docs']
        .map(type => ({ value: `list ${type}`, label: type, hint: 'collection' }));
    } else if (command === 'confirm' || command === 'cancel') {
      values = [{ value: `${command} delete`, label: 'delete', hint: pendingDelete?.title || 'no pending deletion' }];
    }

    return values.filter(item => item.label.toLowerCase().includes(query)).slice(0, 6);
  }, [input, notes, workspaces, activeWorkspaceId, pendingDelete]);

  const applySuggestion = (value: string) => {
    setInput(value);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

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
      if (suggestions[0]) {
        applySuggestion(suggestions[0].value);
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

  const quickCommands = [
    { command: 'help', label: language === 'es' ? 'Ayuda' : 'Help', icon: CircleHelp },
    { command: 'list notes', label: language === 'es' ? 'Notas' : 'Notes', icon: ListTree },
    { command: 'stats', label: language === 'es' ? 'Estadísticas' : 'Stats', icon: BarChart3 },
    { command: 'status', label: language === 'es' ? 'Estado' : 'Status', icon: Server },
    { command: 'activity', label: language === 'es' ? 'Actividad' : 'Activity', icon: Activity },
  ];

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-surface-container-lowest">
      {/* Header */}
      <header className="px-4 @2xl:px-6 py-4 border-b border-white/5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center">
            <Terminal className="w-5 h-5 text-purple-400" />
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-on-surface truncate">{t('consoleHeader', language)}</h1>
            <p className="text-xs text-on-surface-variant font-mono">orqelis v1.0.0</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden @3xl:flex items-center gap-4 whitespace-nowrap text-xs font-mono text-on-surface-variant mr-4">
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
            <span className="hidden @5xl:flex items-center gap-1.5">
              <ListTree className="w-4 h-4" />
              {groups.length} {t('groups', language).toLowerCase()}
            </span>
            <span className="hidden @5xl:flex items-center gap-1.5">
              <Server className="w-4 h-4" />
              {connections.length} {t('connections', language).toLowerCase()}
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

      <div className="px-4 @2xl:px-6 py-2.5 border-b border-outline-variant/20 bg-surface-container-low/50 overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-2 min-w-max" aria-label={language === 'es' ? 'Comandos rápidos' : 'Quick commands'}>
          <span className="text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/60 mr-1">
            {language === 'es' ? 'Comandos rápidos' : 'Quick commands'}
          </span>
          {quickCommands.map(({ command, label, icon: Icon }) => (
            <button
              key={command}
              type="button"
              onClick={() => executeCommand(command)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/25 bg-surface-container px-2.5 py-1.5 text-xs text-on-surface-variant transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              title={command}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Console Output */}
      <div 
        ref={outputRef}
        className="flex-1 overflow-y-auto p-4 @2xl:p-6 font-mono text-sm custom-scrollbar"
        onClick={() => inputRef.current?.focus()}
      >
        <AnimatePresence>
          {history.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("mb-2 overflow-x-auto whitespace-pre", getOutputColor(item.type))}
            >
              {item.content}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="relative px-4 @2xl:px-6 py-4 border-t border-outline-variant/20 bg-surface-container-lowest/90">
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="absolute bottom-full left-4 right-4 @2xl:left-6 @2xl:right-6 mb-2 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container shadow-2xl"
              role="listbox"
              aria-label={language === 'es' ? 'Sugerencias de comandos' : 'Command suggestions'}
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.value}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applySuggestion(suggestion.value)}
                  className="flex w-full items-center justify-between gap-4 px-3 py-2 text-left font-mono text-xs text-on-surface transition-colors hover:bg-primary/10 focus:bg-primary/10 focus:outline-none"
                  role="option"
                  aria-selected={index === 0}
                >
                  <span><span className="text-primary">$</span> {suggestion.value}</span>
                  <span className="text-on-surface-variant/60">{suggestion.hint}</span>
                </button>
              ))}
              <div className="flex items-center justify-end gap-1.5 border-t border-outline-variant/20 px-3 py-1.5 text-[10px] text-on-surface-variant/60">
                <kbd className="rounded bg-surface-container-high px-1.5 py-0.5 font-mono">Tab</kbd>
                {language === 'es' ? 'completar' : 'complete'}
                <CornerDownLeft className="ml-1 h-3 w-3" />
                {language === 'es' ? 'ejecutar' : 'run'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-1 transition-colors focus-within:border-primary/35 focus-within:bg-primary/5">
          <ChevronRight className="w-5 h-5 text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('searchPlaceholder', language)}
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-on-surface font-mono placeholder:text-on-surface-variant/40"
            spellCheck={false}
            autoComplete="off"
          />
          <div className="hidden @xl:flex shrink-0 items-center gap-2 text-xs text-on-surface-variant/60">
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
