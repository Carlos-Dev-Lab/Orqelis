import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  BackgroundVariant,
  Panel,
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'motion/react';
import {
  Filter,
  X,
  FileText,
  Star,
  Share2,
  Tag,
  Cpu,
  Eye,
  EyeOff,
  Code2,
  Layers,
  Laptop,
  Globe,
  Database,
} from 'lucide-react';
import { cn, getCategoryColor } from '@/shared/utils';
import { useAppStore } from '@/shared/store';
import { t } from '@/shared/i18n';
import type { Note } from '@orqelis/shared';
import { Tooltip } from '@/shared/components/Tooltip';
import { NoteModal } from '@/features/notes/NoteModal';

// Custom node components
function GroupNode({ data }: { data: any }) {
  return (
    <div className="p-4 rounded-3xl border-2 border-dashed border-outline/20 bg-surface-container/30 min-w-[300px] min-h-[300px]">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${data.color}33`, color: data.color }}>
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <Tooltip content={data.label} color={data.color}>
            <h3 className="text-lg font-bold text-on-surface leading-none truncate max-w-[200px]">{data.label}</h3>
          </Tooltip>
          {data.description && <p className="text-xs text-on-surface-variant mt-1">{data.description}</p>}
        </div>
      </div>
    </div>
  );
}

function NoteNode({ data, selected }: { data: any; selected: boolean }) {
  const categoryColors: Record<string, string> = {
    frontend: 'from-cyan-500/20 to-cyan-500/5 dark:from-cyan-500/30 dark:to-cyan-500/10 border-cyan-500/30 dark:border-cyan-500/50 shadow-cyan-500/5',
    backend: 'from-blue-500/20 to-blue-500/5 dark:from-blue-500/30 dark:to-blue-500/10 border-blue-500/30 dark:border-blue-500/50 shadow-blue-500/5',
    database: 'from-emerald-500/20 to-emerald-500/5 dark:from-emerald-500/30 dark:to-emerald-500/10 border-emerald-500/30 dark:border-emerald-500/50 shadow-emerald-500/5',
    infrastructure: 'from-orange-500/20 to-orange-500/5 dark:from-orange-500/30 dark:to-orange-500/10 border-orange-500/30 dark:border-orange-500/50 shadow-orange-500/5',
    devops: 'from-purple-500/20 to-purple-500/5 dark:from-purple-500/30 dark:to-purple-500/10 border-purple-500/30 dark:border-purple-500/50 shadow-purple-500/5',
    docs: 'from-slate-500/20 to-slate-500/5 dark:from-slate-500/30 dark:to-slate-500/10 border-slate-500/30 dark:border-slate-500/50 shadow-slate-500/5',
  };

  const colorClass = categoryColors[data.category] || categoryColors.docs;

  return (
    <div
      className={cn(
        "px-4 py-3 rounded-xl bg-gradient-to-br border backdrop-blur-sm transition-all duration-200 cursor-pointer min-w-[140px]",
        colorClass,
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 shadow-2xl",
        !selected && "hover:scale-[1.02] shadow-xl"
      )}
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-primary opacity-0" />
      <div className="flex items-center gap-2 mb-1">
        <FileText className="w-4 h-4 text-on-surface/60 dark:text-white/70" />
        {data.isFavorite && <Star className="w-3 h-3 text-amber-500 fill-amber-500 dark:text-amber-400 dark:fill-amber-400" />}
      </div>
      <Tooltip content={data.label} color={data.category === 'frontend' ? 'var(--color-react)' : data.category === 'backend' ? 'var(--color-backend)' : data.category === 'database' ? 'var(--color-database)' : data.category === 'infrastructure' || data.category === 'infra' ? 'var(--color-infra)' : data.category === 'devops' ? 'var(--color-devops)' : undefined}>
        <h3 className="font-semibold text-on-surface dark:text-white text-sm truncate max-w-[160px]">
          {data.label}
        </h3>
      </Tooltip>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[10px] font-mono uppercase text-on-surface-variant/70 dark:text-white/60">
          {data.category}
        </span>
        {data.linkCount > 0 && (
          <span className="text-[10px] font-mono text-on-surface-variant/70 dark:text-white/60 flex items-center gap-1">
            <Share2 className="w-3 h-3" />
            {data.linkCount}
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-primary opacity-0" />
    </div>
  );
}

// Custom snippet ("code") node component
function SnippetNode({ data, selected }: { data: any; selected: boolean }) {
  return (
    <div
      className={cn(
        'px-3 py-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/5 dark:from-purple-500/30 dark:to-purple-500/10 border border-purple-500/30 dark:border-purple-500/50 backdrop-blur-sm transition-all duration-200 cursor-pointer min-w-[120px] shadow-purple-500/5',
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 shadow-2xl',
        !selected && 'hover:scale-[1.02] shadow-xl'
      )}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="flex items-center gap-2 mb-1">
        <Code2 className="w-3.5 h-3.5 text-on-surface/60 dark:text-white/70" />
        {data.isFavorite && <Star className="w-3 h-3 text-amber-500 fill-amber-500 dark:text-amber-400 dark:fill-amber-400" />}
      </div>
      <Tooltip content={data.label} color="#a78bfa">
        <h3 className="font-semibold text-on-surface dark:text-white text-xs truncate max-w-[150px]">{data.label}</h3>
      </Tooltip>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[9px] font-mono uppercase text-on-surface-variant/70 dark:text-white/60">{data.language}</span>
        {data.usageCount > 0 && (
          <span className="text-[9px] font-mono text-on-surface-variant/70 dark:text-white/60">×{data.usageCount}</span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}

function ConnectionNode({ data, selected }: { data: any; selected: boolean }) {
  const isWeb = data.type === 'web';
  const isDatabase = data.type === 'database';
  const typeColor = isWeb ? 'var(--secondary)' : isDatabase ? 'var(--color-database)' : 'var(--primary)';

  return (
    <div
      className={cn(
        'px-3 py-2 rounded-lg bg-gradient-to-br border backdrop-blur-sm transition-all duration-200 cursor-pointer min-w-[120px]',
        isWeb 
          ? 'from-secondary/20 to-secondary/5 dark:from-secondary/30 dark:to-secondary/10 border-secondary/30 dark:border-secondary/50 shadow-secondary/5'
          : isDatabase
            ? 'from-emerald-500/20 to-emerald-500/5 dark:from-emerald-500/30 dark:to-emerald-500/10 border-emerald-500/30 dark:border-emerald-500/50 shadow-emerald-500/5'
            : 'from-orange-500/20 to-orange-500/5 dark:from-orange-500/30 dark:to-orange-500/10 border-orange-500/30 dark:border-orange-500/50 shadow-orange-500/5',
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 shadow-2xl',
        !selected && 'hover:scale-[1.02] shadow-xl'
      )}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="flex items-center gap-2 mb-1">
        {isWeb ? (
          <Globe className="w-3.5 h-3.5 text-secondary" />
        ) : isDatabase ? (
          <Database className="w-3.5 h-3.5 text-[var(--color-database)]" />
        ) : (
          <Laptop className="w-3.5 h-3.5 text-primary" />
        )}
      </div>
      <Tooltip content={data.label} color={typeColor}>
        <h3 className="font-semibold text-on-surface dark:text-white text-xs truncate max-w-[150px]">{data.label}</h3>
      </Tooltip>
      <div className="flex items-center gap-2 mt-1">
        <Tooltip content={data.host} color={typeColor}>
          <span className="text-[9px] font-mono uppercase text-on-surface-variant/70 dark:text-white/60 truncate max-w-[100px]">{data.host}</span>
        </Tooltip>
      </div>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}

function GraphView() {
  const {
    notes,
    snippets,
    groups,
    connections,
    setActiveNoteId,
    setActiveSnippetId,
    setActiveConnectionId,
    setActiveGroupId,
    setCurrentView,
    theme,
    language,
  } = useAppStore();

  const nodeTypes = useMemo(() => ({
    groupNode: GroupNode,
    noteNode: NoteNode,
    snippetNode: SnippetNode,
    connectionNode: ConnectionNode,
  }), []);

  const edgeTypes = useMemo(() => ({}), []);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterGroupId, setFilterGroupId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showOrphans, setShowOrphans] = useState(true);
  const [showSnippets, setShowSnippets] = useState(true);
  const [showConnections, setShowConnections] = useState(true);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [modalNoteId, setModalNoteId] = useState<string | null>(null);

  // Build graph data
  useEffect(() => {
    const noteMap = new Map(notes.map(n => [n.title.toLowerCase(), n]));

    // Filter notes
    let filteredNotes = notes;
    if (filterCategory) {
      filteredNotes = filteredNotes.filter(n => n.category === filterCategory);
    }
    if (filterGroupId) {
      filteredNotes = filteredNotes.filter(n => n.groupId === filterGroupId);
    }
    if (!showOrphans) {
      filteredNotes = filteredNotes.filter(n => n.links.length > 0);
    }

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const groupChildrenMap = new Map<string, any[]>();
    const orphanNotes: Note[] = [];
    const orphanSnippets: any[] = [];
    const orphanConnections: any[] = [];

    // Distribute notes
    filteredNotes.forEach(n => {
      if (n.groupId) {
        if (!groupChildrenMap.has(n.groupId)) groupChildrenMap.set(n.groupId, []);
        groupChildrenMap.get(n.groupId)!.push({ ...n, type: 'note' });
      } else {
        orphanNotes.push(n);
      }
    });

    // Distribute snippets
    if (showSnippets) {
      const visibleSnippets = snippets.filter((s) => {
        if (s.groupId) return true; // Always show if in a group
        if (!filteredNotes.length) return true;
        return filteredNotes.some((n) =>
          (n.snippetIds || []).includes(s.id) || (s.noteIds || []).includes(n.id)
        );
      });

      visibleSnippets.forEach(s => {
        if (s.groupId) {
          if (!groupChildrenMap.has(s.groupId)) groupChildrenMap.set(s.groupId, []);
          groupChildrenMap.get(s.groupId)!.push({ ...s, type: 'snippet' });
        } else {
          orphanSnippets.push(s);
        }
      });
    }

    // Distribute Connections
    if (showConnections) {
      const visibleConnections = connections.filter(conn => {
        const hasLinkedNote = (conn.noteIds || []).some(id => filteredNotes.some(fn => fn.id === id));
        const hasLinkedSnippet = (conn.snippetIds || []).some(id => snippets.some(s => s.id === id));
        return hasLinkedNote || hasLinkedSnippet;
      });

      visibleConnections.forEach(conn => {
        orphanConnections.push(conn);
      });
    }

    const activeGroups = groups.filter(g => groupChildrenMap.has(g.id));
    const mainItemsCount = activeGroups.length + orphanNotes.length + orphanSnippets.length + orphanConnections.length;
    const radius = Math.max(600, mainItemsCount * 80);
    const centerX = 1000;
    const centerY = 1000;

    // Helper for positioning main items
    const getMainPosition = (index: number) => {
      const angle = (index / Math.max(mainItemsCount, 1)) * 2 * Math.PI;
      return {
        x: Math.cos(angle) * radius + centerX,
        y: Math.sin(angle) * radius + centerY,
      };
    };

    let mainIndex = 0;

    // 1. Create Group Nodes and their children
    activeGroups.forEach(group => {
      const children = groupChildrenMap.get(group.id) || [];
      const pos = getMainPosition(mainIndex++);
      
      // Calculate group size (grid-based)
      const cols = Math.ceil(Math.sqrt(children.length));
      const rows = Math.ceil(children.length / cols);
      const groupWidth = Math.max(350, cols * 220 + 40);
      const groupHeight = Math.max(350, rows * 120 + 100);

      newNodes.push({
        id: group.id,
        type: 'groupNode',
        position: pos,
        data: {
          label: group.name,
          description: group.description,
          color: group.color,
        },
        style: { width: groupWidth, height: groupHeight, zIndex: -1 },
      });

      // Position children inside group
      children.forEach((child, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        
        const childId = child.type === 'note' ? child.id : `snippet-${child.id}`;
        newNodes.push({
          id: childId,
          type: child.type === 'note' ? 'noteNode' : 'snippetNode',
          position: {
            x: 40 + col * 220,
            y: 80 + row * 120,
          },
          parentId: group.id,
          extent: 'parent',
          data: {
            label: child.title,
            category: child.type === 'note' ? child.category : undefined,
            isFavorite: child.isFavorite,
            linkCount: child.type === 'note' ? child.links.length : undefined,
            language: child.type === 'snippet' ? child.language : undefined,
            usageCount: child.type === 'snippet' ? child.usageCount : undefined,
            noteId: child.type === 'note' ? child.id : undefined,
            snippetId: child.type === 'snippet' ? child.id : undefined,
          },
        });
      });
    });

    // 2. Create Orphan Note Nodes
    orphanNotes.forEach(note => {
      const pos = getMainPosition(mainIndex++);
      newNodes.push({
        id: note.id,
        type: 'noteNode',
        position: pos,
        data: {
          label: note.title,
          category: note.category,
          isFavorite: note.isFavorite,
          linkCount: note.links.length,
          noteId: note.id,
        },
      });
    });

    // 3. Create Orphan Snippet Nodes
    orphanSnippets.forEach(snippet => {
      const pos = getMainPosition(mainIndex++);
      newNodes.push({
        id: `snippet-${snippet.id}`,
        type: 'snippetNode',
        position: pos,
        data: {
          label: snippet.title,
          language: snippet.language,
          isFavorite: snippet.isFavorite,
          usageCount: snippet.usageCount,
          snippetId: snippet.id,
        },
      });
    });

    // 4. Create Orphan Connection Nodes
    orphanConnections.forEach(conn => {
      const pos = getMainPosition(mainIndex++);
      newNodes.push({
        id: `conn-${conn.id}`,
        type: 'connectionNode',
        position: pos,
        data: {
          label: conn.name,
          host: conn.host,
          type: conn.type,
          connId: conn.id,
        },
      });
    });

    // 5. Create Edges
    // Note to Note edges
    const processedPairs = new Set<string>();

    notes.forEach(note => {
      note.links.forEach(linkTitle => {
        const linkedNote = noteMap.get(linkTitle.toLowerCase());
        if (linkedNote && note.id !== linkedNote.id) {
          // Check if both nodes are visible
          const sourceExists = newNodes.some(n => n.id === note.id);
          const targetExists = newNodes.some(n => n.id === linkedNote.id);
          
          if (sourceExists && targetExists) {
            const pairId = [note.id, linkedNote.id].sort().join('-');
            
            if (!processedPairs.has(pairId)) {
              processedPairs.add(pairId);
              
              const isBidirectional = linkedNote.links.some(
                l => l.toLowerCase() === note.title.toLowerCase()
              );

              const isSelected = selectedNode === note.id || selectedNode === linkedNote.id;
              const anySelected = !!selectedNode;

              newEdges.push({
                id: pairId,
                source: note.id,
                target: linkedNote.id,
                type: 'smoothstep',
                animated: isSelected || !anySelected,
                style: { 
                  stroke: isSelected
                    ? (theme === 'dark' ? '#22d3ee' : '#0891b2')
                    : (theme === 'dark' ? 'rgba(34, 211, 238, 0.4)' : 'rgba(8, 145, 178, 0.5)'), 
                  strokeWidth: isSelected ? 3 : 2,
                  opacity: anySelected ? (isSelected ? 1 : 0.1) : 1,
                },
                markerEnd: { 
                  type: MarkerType.ArrowClosed, 
                  color: isSelected
                    ? (theme === 'dark' ? '#22d3ee' : '#0891b2')
                    : (theme === 'dark' ? 'rgba(34, 211, 238, 0.6)' : 'rgba(8, 145, 178, 0.7)')
                },
                markerStart: isBidirectional ? {
                  type: MarkerType.ArrowClosed,
                  color: isSelected
                    ? (theme === 'dark' ? '#22d3ee' : '#0891b2')
                    : (theme === 'dark' ? 'rgba(34, 211, 238, 0.6)' : 'rgba(8, 145, 178, 0.7)')
                } : undefined,
              });
            }
          }
        }
      });
    });

    // Snippet edges (to notes)
    if (showSnippets) {
      snippets.forEach(snippet => {
        const snippetNodeId = `snippet-${snippet.id}`;
        if (!newNodes.some(n => n.id === snippetNodeId)) return;

        notes.forEach(note => {
          if (!newNodes.some(n => n.id === note.id)) return;

          const noteToSnippet = (note.snippetIds || []).includes(snippet.id);
          const snippetToNote = (snippet.noteIds || []).includes(note.id);
          
          if (noteToSnippet || snippetToNote) {
            const edgeId = `edge-${snippet.id}-${note.id}`;
            const isSelected = selectedNode === note.id || selectedNode === snippetNodeId;
            const anySelected = !!selectedNode;

            newEdges.push({
              id: edgeId,
              source: noteToSnippet ? note.id : snippetNodeId,
              target: noteToSnippet ? snippetNodeId : note.id,
              type: 'simplebezier',
              animated: true,
              style: { 
                stroke: isSelected
                  ? (theme === 'dark' ? '#a78bfa' : '#7c3aed')
                  : (theme === 'dark' ? 'rgba(167, 139, 250, 0.3)' : 'rgba(124, 58, 237, 0.4)'), 
                strokeWidth: isSelected ? 3 : 2, 
                strokeDasharray: isSelected ? undefined : '5,5',
                opacity: anySelected ? (isSelected ? 1 : 0.1) : 1,
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: isSelected
                  ? (theme === 'dark' ? '#a78bfa' : '#7c3aed')
                  : (theme === 'dark' ? 'rgba(167, 139, 250, 0.6)' : 'rgba(124, 58, 237, 0.7)')
              },
              markerStart: (noteToSnippet && snippetToNote) ? {
                type: MarkerType.ArrowClosed,
                color: isSelected
                  ? (theme === 'dark' ? '#a78bfa' : '#7c3aed')
                  : (theme === 'dark' ? 'rgba(167, 139, 250, 0.6)' : 'rgba(124, 58, 237, 0.7)')
              } : undefined,
            });
          }
        });
      });
    }

    // Connection edges
    if (showConnections) {
      connections.forEach(conn => {
        const connNodeId = `conn-${conn.id}`;
        if (!newNodes.some(n => n.id === connNodeId)) return;

        // Links to notes
        (conn.noteIds || []).forEach(noteId => {
          if (!newNodes.some(n => n.id === noteId)) return;
          const edgeId = `edge-conn-${conn.id}-note-${noteId}`;
          const isSelected = selectedNode === noteId || selectedNode === connNodeId;
          const anySelected = !!selectedNode;

          newEdges.push({
            id: edgeId,
            source: connNodeId,
            target: noteId,
            type: 'simplebezier',
            animated: true,
            style: { 
              stroke: isSelected
                ? (theme === 'dark' ? '#fb923c' : '#f97316')
                : (theme === 'dark' ? 'rgba(251, 146, 60, 0.3)' : 'rgba(249, 115, 22, 0.4)'), 
              strokeWidth: isSelected ? 3 : 2,
              opacity: anySelected ? (isSelected ? 1 : 0.1) : 1,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isSelected
                ? (theme === 'dark' ? '#fb923c' : '#f97316')
                : (theme === 'dark' ? 'rgba(251, 146, 60, 0.6)' : 'rgba(249, 115, 22, 0.7)')
            },
          });
        });

        // Links to snippets
        (conn.snippetIds || []).forEach(snippetId => {
          const snippetNodeId = `snippet-${snippetId}`;
          if (!newNodes.some(n => n.id === snippetNodeId)) return;
          const edgeId = `edge-conn-${conn.id}-snippet-${snippetId}`;
          const isSelected = selectedNode === snippetNodeId || selectedNode === connNodeId;
          const anySelected = !!selectedNode;

          newEdges.push({
            id: edgeId,
            source: connNodeId,
            target: snippetNodeId,
            type: 'simplebezier',
            animated: true,
            style: { 
              stroke: isSelected
                ? (theme === 'dark' ? '#fb923c' : '#f97316')
                : (theme === 'dark' ? 'rgba(251, 146, 60, 0.3)' : 'rgba(249, 115, 22, 0.4)'), 
              strokeWidth: isSelected ? 3 : 2,
              strokeDasharray: '3,3',
              opacity: anySelected ? (isSelected ? 1 : 0.1) : 1,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isSelected
                ? (theme === 'dark' ? '#fb923c' : '#f97316')
                : (theme === 'dark' ? 'rgba(251, 146, 60, 0.6)' : 'rgba(249, 115, 22, 0.7)')
            },
          });
        });
      });
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [notes, snippets, groups, connections, filterCategory, filterGroupId, showOrphans, showSnippets, showConnections, setNodes, setEdges, theme, selectedNode]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
  }, []);

  const handleNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === 'snippetNode') {
      setCurrentView('snippets');
      return;
    }
    if (node.type === 'connectionNode') {
      setCurrentView('connections');
      return;
    }

    // Abrir la nota en la misma vista (modal) en lugar de navegar a Notes/Editor
    const nid = (node.data.noteId || node.id) as string;
    setActiveNoteId(nid);
    setModalNoteId(nid);
    setIsNoteModalOpen(true);
  }, [setActiveNoteId, setCurrentView]);

  const selectedElement = useMemo(() => {
    if (!selectedNode) return null;
    
    // Check notes
    const note = notes.find(n => n.id === selectedNode);
    if (note) return { type: 'note', data: note };
    
    // Check snippets
    const snippetId = selectedNode.startsWith('snippet-') ? selectedNode.replace('snippet-', '') : selectedNode;
    const snippet = snippets.find(s => s.id === snippetId);
    if (snippet) return { type: 'snippet', data: snippet };
    
    // Check connections
    const connId = selectedNode.startsWith('conn-') ? selectedNode.replace('conn-', '') : selectedNode;
    const conn = connections.find(c => c.id === connId);
    if (conn) return { type: 'connection', data: conn };
    
    // Check groups
    const group = groups.find(g => g.id === selectedNode);
    if (group) return { type: 'group', data: group };
    
    return null;
  }, [selectedNode, notes, snippets, connections, groups]);

  // Stats
  const stats = useMemo(() => {
    const categories: Record<string, number> = {};
    notes.forEach(n => {
      categories[n.category] = (categories[n.category] || 0) + 1;
    });
    return {
      total: notes.length,
      snippets: snippets.length,
      connections: connections.filter(c => (c.noteIds?.length || 0) > 0 || (c.snippetIds?.length || 0) > 0).length,
      noteLinks: notes.reduce((acc, n) => acc + n.links.length, 0),
      categories,
    };
  }, [notes, snippets, connections]);

  return (
    <div className="h-[calc(100vh-3.5rem)] relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onPaneClick={() => setSelectedNode(null)}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
        className="bg-background"
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          className="bg-background opacity-50 dark:opacity-100"
        />
        <Controls 
          className="!bg-surface-container !border-on-surface/10 !shadow-xl [&>button]:!bg-surface-container [&>button]:!border-on-surface/10 [&>button]:!text-on-surface-variant [&>button:hover]:!bg-on-surface/5"
          showZoom={true}
          showFitView={true}
          showInteractive={false}
        />
        <MiniMap 
          className="!bg-surface-container/80 !border-on-surface/10"
          nodeColor={(node) => {
            const colors: Record<string, string> = {
              frontend: '#22d3ee',
              backend: '#60a5fa',
              database: '#34d399',
              infrastructure: '#fb923c',
              devops: '#a78bfa',
              docs: '#64748b',
            };
            return colors[node.data?.category as string] || '#64748b';
          }}
        />

        {/* Stats Panel */}
        <Panel position="top-left">
          <div className="glass-panel rounded-xl p-4 space-y-3 min-w-[200px]">
            <h3 className="font-semibold text-on-surface flex items-center gap-2">
              <Share2 className="w-4 h-4 text-primary" />
              {t('knowledgeGraph', language)}
            </h3>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-xl font-bold text-on-surface">{stats.total}</p>
                <p className="text-[10px] text-on-surface-variant">{t('notes', language)}</p>
              </div>
              <div>
                <p className="text-xl font-bold text-on-surface">{stats.snippets}</p>
                <p className="text-[10px] text-on-surface-variant">{t('codes', language)}</p>
              </div>
              <div>
                <p className="text-xl font-bold text-on-surface">{stats.connections}</p>
                <p className="text-[10px] text-on-surface-variant">{t('connections', language)}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-white/10 space-y-1">
              {Object.entries(stats.categories).map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", getCategoryColor(cat))} />
                    <span className="capitalize text-on-surface-variant">{cat}</span>
                  </div>
                  <span className="font-mono text-on-surface">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* Filter Panel */}
        <Panel position="top-right">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConnections(!showConnections)}
              className={cn(
                'p-2 rounded-lg transition-colors glass-panel',
                showConnections ? 'border-orange-500/50 text-orange-400' : 'text-on-surface-variant'
              )}
              title={showConnections ? t('hideConnections', language) : t('showConnections', language)}
            >
              <Laptop className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowSnippets(!showSnippets)}
              className={cn(
                'p-2 rounded-lg transition-colors glass-panel',
                showSnippets ? 'border-purple-500/50 text-purple-400' : 'text-on-surface-variant'
              )}
              title={showSnippets ? t('hideSnippets', language) : t('showSnippets', language)}
            >
              <Code2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowOrphans(!showOrphans)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                showOrphans
                  ? 'glass-panel text-on-surface-variant'
                  : 'glass-panel border-warning/50 text-warning'
              )}
              title={showOrphans ? t('hideOrphans', language) : t('showOrphans', language)}
            >
              {showOrphans ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'p-2 rounded-lg transition-colors glass-panel',
                filterCategory || filterGroupId ? 'border-primary/50 text-primary' : 'text-on-surface-variant'
              )}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-12 right-0 glass-panel rounded-xl p-4 min-w-[180px]"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-on-surface text-sm">{t('filterCategory', language)}</h4>
                  <button 
                    onClick={() => setShowFilters(false)}
                    className="p-1 rounded hover:bg-on-surface/10"
                  >
                    <X className="w-4 h-4 text-on-surface-variant" />
                  </button>
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => setFilterCategory(null)}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg text-left text-sm transition-colors flex items-center gap-2',
                      !filterCategory ? 'bg-primary/20 text-primary' : 'hover:bg-on-surface/10 text-on-surface-variant'
                    )}
                  >
                    <Tag className="w-4 h-4" />
                    {t('allCategories', language)}
                  </button>
                  {Object.keys(stats.categories).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg text-left text-sm transition-colors flex items-center gap-2 capitalize',
                        filterCategory === cat ? 'bg-primary/20 text-primary' : 'hover:bg-on-surface/10 text-on-surface-variant'
                      )}
                    >
                      <span className={cn('w-2 h-2 rounded-full', getCategoryColor(cat))} />
                      {cat}
                    </button>
                  ))}
                </div>

                {groups.length > 0 && (
                  <>
                    <h4 className="font-medium text-on-surface text-sm mt-4 mb-2 flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5" />
                      {t('filterGroup', language)}
                    </h4>
                    <div className="space-y-1">
                      <button
                        onClick={() => setFilterGroupId(null)}
                        className={cn(
                          'w-full px-3 py-2 rounded-lg text-left text-sm transition-colors flex items-center gap-2',
                          !filterGroupId ? 'bg-primary/20 text-primary' : 'hover:bg-on-surface/10 text-on-surface-variant'
                        )}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        {t('allGroups', language)}
                      </button>
                      {groups.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => setFilterGroupId(g.id)}
                          className={cn(
                            'w-full px-3 py-2 rounded-lg text-left text-sm transition-colors flex items-center gap-2',
                            filterGroupId === g.id ? 'bg-primary/20 text-primary' : 'hover:bg-on-surface/10 text-on-surface-variant'
                          )}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                          {g.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Panel>

        {/* Selected Node Details - Dev Console Style */}
        <AnimatePresence>
          {selectedElement && (
            <Panel position="bottom-right" className="m-4">
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                className="bg-surface-container-lowest/90 backdrop-blur-xl border border-primary/20 rounded-2xl p-0 overflow-hidden shadow-2xl w-[320px]"
              >
                {/* Console Header */}
                <div className="bg-primary/10 px-4 py-2 border-b border-primary/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">
                      {selectedElement.type}_properties
                    </span>
                  </div>
                  <button 
                    onClick={() => setSelectedNode(null)}
                    className="p-1 hover:bg-primary/10 rounded-md transition-colors"
                  >
                    <X className="w-4 h-4 text-primary/70" />
                  </button>
                </div>

                {/* Console Content */}
                <div className="p-4 font-mono text-[11px] space-y-4 max-h-[450px] overflow-y-auto custom-scrollbar">
                  {/* Basic Section */}
                  <div>
                    <div className="text-primary/50 mb-1">{'// General'}</div>
                    <div className="flex gap-2 mb-0.5">
                      <span className="text-on-surface-variant opacity-40">{'>'}</span>
                      <span className="text-on-surface-variant w-20 shrink-0">uuid:</span>
                      <span className="text-on-surface truncate">"{selectedElement.data.id}"</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-on-surface-variant opacity-40">{'>'}</span>
                      <span className="text-on-surface-variant w-20 shrink-0">name:</span>
                      <span className="text-primary">"{'title' in selectedElement.data ? selectedElement.data.title : (selectedElement.data as any).name}"</span>
                    </div>
                  </div>

                  {/* Metadata Section */}
                  {selectedElement.type === 'note' && (
                    <>
                      <div>
                        <div className="text-primary/50 mb-1">{'// Metadata'}</div>
                        <div className="flex gap-2 mb-0.5">
                          <span className="text-on-surface-variant opacity-40">{'>'}</span>
                          <span className="text-on-surface-variant w-20 shrink-0">category:</span>
                          <span className={cn("px-1 rounded bg-primary/10", (selectedElement.data as any).category === 'frontend' ? 'text-cyan-400' : (selectedElement.data as any).category === 'backend' ? 'text-blue-400' : 'text-primary')}>
                            {(selectedElement.data as any).category}
                          </span>
                        </div>
                        <div className="flex gap-2 mb-0.5">
                          <span className="text-on-surface-variant opacity-40">{'>'}</span>
                          <span className="text-on-surface-variant w-20 shrink-0">tags:</span>
                          <span className="text-secondary">[{ (selectedElement.data as any).tags.length > 0 ? (selectedElement.data as any).tags.map((t: string) => `"${t}"`).join(', ') : '' }]</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-on-surface-variant opacity-40">{'>'}</span>
                          <span className="text-on-surface-variant w-20 shrink-0">group_id:</span>
                          <span className="text-on-surface-variant">{(selectedElement.data as any).groupId || 'null'}</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-primary/50 mb-1">{'// Architecture'}</div>
                        <div className="flex gap-2 mb-0.5">
                          <span className="text-on-surface-variant opacity-40">{'>'}</span>
                          <span className="text-on-surface-variant w-20 shrink-0">out_links:</span>
                          <span className="text-on-surface">{(selectedElement.data as any).links.length}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-on-surface-variant opacity-40">{'>'}</span>
                          <span className="text-on-surface-variant w-20 shrink-0">snippets:</span>
                          <span className="text-on-surface">{(selectedElement.data as any).snippetIds?.length || 0}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedElement.type === 'snippet' && (
                    <>
                      <div>
                        <div className="text-primary/50 mb-1">{'// Code Specification'}</div>
                        <div className="flex gap-2 mb-0.5">
                          <span className="text-on-surface-variant opacity-40">{'>'}</span>
                          <span className="text-on-surface-variant w-20 shrink-0">language:</span>
                          <span className="text-purple-400">"{(selectedElement.data as any).language}"</span>
                        </div>
                        <div className="flex gap-2 mb-0.5">
                          <span className="text-on-surface-variant opacity-40">{'>'}</span>
                          <span className="text-on-surface-variant w-20 shrink-0">uses:</span>
                          <span className="text-on-surface">{(selectedElement.data as any).usageCount || 0}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-on-surface-variant opacity-40">{'>'}</span>
                          <span className="text-on-surface-variant w-20 shrink-0">framework:</span>
                          <span className="text-on-surface">"{(selectedElement.data as any).framework || 'n/a'}"</span>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedElement.type === 'connection' && (
                    <>
                      <div>
                        <div className="text-primary/50 mb-1">{'// Network Config'}</div>
                        <div className="flex gap-2 mb-0.5">
                          <span className="text-on-surface-variant opacity-40">{'>'}</span>
                          <span className="text-on-surface-variant w-20 shrink-0">type:</span>
                          <span className="text-orange-400">"{(selectedElement.data as any).type}"</span>
                        </div>
                        <div className="flex gap-2 mb-0.5">
                          <span className="text-on-surface-variant opacity-40">{'>'}</span>
                          <span className="text-on-surface-variant w-20 shrink-0">host:</span>
                          <span className="text-on-surface">"{(selectedElement.data as any).host}"</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-on-surface-variant opacity-40">{'>'}</span>
                          <span className="text-on-surface-variant w-20 shrink-0">port:</span>
                          <span className="text-on-surface">{(selectedElement.data as any).port || 'default'}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedElement.type === 'group' && (
                    <>
                      <div>
                        <div className="text-primary/50 mb-1">{'// Logical Cluster'}</div>
                        <div className="flex gap-2 mb-0.5">
                          <span className="text-on-surface-variant opacity-40">{'>'}</span>
                          <span className="text-on-surface-variant w-20 shrink-0">color:</span>
                          <span style={{ color: (selectedElement.data as any).color }}>"{(selectedElement.data as any).color}"</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-on-surface-variant opacity-40">{'>'}</span>
                          <span className="text-on-surface-variant w-20 shrink-0">notes:</span>
                          <span className="text-on-surface">
                            {notes.filter(n => n.groupId === selectedElement.data.id).length}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* System Info */}
                  <div>
                    <div className="text-primary/50 mb-1">{'// System'}</div>
                    <div className="flex gap-2 mb-0.5">
                      <span className="text-on-surface-variant opacity-40">{'>'}</span>
                      <span className="text-on-surface-variant w-20 shrink-0">created:</span>
                      <span className="text-on-surface-variant/70">{new Date(selectedElement.data.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-on-surface-variant opacity-40">{'>'}</span>
                      <span className="text-on-surface-variant w-20 shrink-0">modified:</span>
                      <span className="text-on-surface-variant/70">{new Date(selectedElement.data.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                {/* Footer Action */}
                <div className="p-3 bg-on-surface/5 border-t border-on-surface/5 flex gap-2">
                  <button
                    onClick={() => {
                      if (selectedElement.type === 'note') {
                        const nid = selectedElement.data.id as string;
                        setActiveNoteId(nid);
                        setModalNoteId(nid);
                        setIsNoteModalOpen(true);
                      } else if (selectedElement.type === 'snippet') {
                        setActiveSnippetId(selectedElement.data.id);
                        setCurrentView('snippets');
                      } else if (selectedElement.type === 'connection') {
                        setActiveConnectionId(selectedElement.data.id);
                        setCurrentView('connections');
                      } else if (selectedElement.type === 'group') {
                        setActiveGroupId(selectedElement.data.id);
                        setCurrentView('editor');
                      }
                    }}
                    className="flex-1 py-2 bg-primary text-on-primary rounded-lg text-[10px] font-bold uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
                  >
                    Execute Open
                  </button>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="px-3 py-2 bg-on-surface/10 text-on-surface-variant rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-on-surface/20 transition-all"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </Panel>
          )}
        </AnimatePresence>
      </ReactFlow>

      {/* Instructions Overlay */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <Share2 className="w-16 h-16 text-on-surface-variant/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-on-surface-variant mb-2">{t('noNotesYet', language)}</h3>
            <p className="text-on-surface-variant/60 max-w-sm">
              {t('graphWelcome', language)}
            </p>
          </div>
        </div>
      )}
      {/* Note Modal (abre en la misma vista) */}
      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => {
          setIsNoteModalOpen(false);
          setModalNoteId(null);
          // opcional: limpiar active note para no interferir con otras vistas
          setActiveNoteId(null);
        }}
        noteId={modalNoteId}
      />
    </div>
  );
}

export default GraphView;
