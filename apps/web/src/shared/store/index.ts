import { create } from 'zustand';
import { api } from '@/shared/api';
import { generateId } from '@/shared/utils';
import { type Language } from '@/shared/i18n';
import type { 
  Note, Snippet, Workspace, Activity, Group, 
  Notification, Connection, Credential 
} from '@orqelis/shared';

export type ViewType = 
  | 'landing' | 'dashboard' | 'editor' | 'graph' 
  | 'console' | 'snippets' | 'connections' | 'settings' 
  | 'search' | 'setup' | 'login';

export interface SystemStatus {
  ready: boolean;
  configured: boolean;
  database: 'connected' | 'error' | 'schema_missing' | 'unknown';
  details?: string;
  missingTables?: string[];
  checkedAt: string;
}

interface AppState {
  // Navigation
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  
  // Active entities
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;
  activeSnippetId: string | null;
  setActiveSnippetId: (id: string | null) => void;
  activeConnectionId: string | null;
  setActiveConnectionId: (id: string | null) => void;
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string | null) => void;
  
  // UI State
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  rightPanelOpen: boolean;
  setRightPanelOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  workspaceManagerOpen: boolean;
  setWorkspaceManagerOpen: (open: boolean) => void;
  groupManagerOpen: boolean;
  setGroupManagerOpen: (open: boolean) => void;
  
  // Data
  notes: Note[];
  snippets: Snippet[];
  workspaces: Workspace[];
  groups: Group[];
  connections: Connection[];
  recentActivity: Activity[];
  notifications: Notification[];

  // Group filter
  activeGroupId: string | null;
  setActiveGroupId: (id: string | null) => void;

  // Data actions
  loadData: () => Promise<void>;

  // Group actions
  createGroup: (group: Partial<Group>) => Promise<Group>;
  updateGroup: (id: string, updates: Partial<Group>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  assignNoteToGroup: (noteId: string, groupId: string | null) => Promise<void>;
  assignSnippetToGroup: (snippetId: string, groupId: string | null) => Promise<void>;
  
  // Note actions
  createNote: (note: Partial<Note>) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  toggleNoteFavorite: (id: string) => Promise<void>;
  
  // Snippet actions
  createSnippet: (snippet: Partial<Snippet>) => Promise<Snippet>;
  updateSnippet: (id: string, updates: Partial<Snippet>) => Promise<void>;
  deleteSnippet: (id: string) => Promise<void>;
  incrementSnippetUsage: (id: string) => Promise<void>;

  // Connection actions
  createConnection: (connection: Partial<Connection>, credentials: Partial<Credential>[]) => Promise<Connection>;
  updateConnection: (id: string, updates: Partial<Connection>, credentials?: { id?: string; username: string; password: string }[]) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;
  linkConnectionAndNote: (connId: string, noteId: string) => Promise<void>;
  unlinkConnectionAndNote: (connId: string, noteId: string) => Promise<void>;
  linkConnectionAndSnippet: (connId: string, snippetId: string) => Promise<void>;
  unlinkConnectionAndSnippet: (connId: string, snippetId: string) => Promise<void>;

  // Relations
  linkNoteAndSnippet: (noteId: string, snippetId: string) => Promise<void>;
  unlinkNoteAndSnippet: (noteId: string, snippetId: string) => Promise<void>;
  
  // Workspace actions
  createWorkspace: (workspace: Partial<Workspace>) => Promise<Workspace>;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  switchWorkspace: (id: string) => Promise<void>;
  
  // Activity
  logActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => Promise<void>;

  // Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearNotifications: () => Promise<void>;

  // Settings
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  settingsActiveTab: string;
  setSettingsActiveTab: (tab: string) => void;

  // Auth State
  user: { id: string; email: string; role: string; name?: string; image?: string } | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;

  // Connection Status
  isServerOnline: boolean;
  isDbOnline: boolean;
  setServerOnline: (online: boolean) => void;
  setDbOnline: (online: boolean) => void;
  showConnectionModal: boolean;
  setShowConnectionModal: (show: boolean) => void;
  
  // Auth checking state
  isCheckingAuth: boolean;
  
  // Setup
  needsSetup: boolean;
  isCheckingSetup: boolean;
  systemStatus: SystemStatus | null;
  checkSetup: (refresh?: boolean) => Promise<void>;

  // Dialogs
  alertDialog: {
    show: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm';
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  };
  showAlert: (title: string, message: string, confirmLabel?: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void, confirmLabel?: string, cancelLabel?: string) => void;
  hideAlert: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  currentView: (() => {
    if (typeof window === 'undefined') return 'landing';
    const path = window.location.pathname.replace('/', '') as ViewType;
    const validViews: ViewType[] = ['landing', 'dashboard', 'editor', 'graph', 'console', 'snippets', 'connections', 'settings', 'search', 'setup', 'login'];
    
    if (path && validViews.includes(path)) return path;
    
    return 'landing';
  })(),
  setCurrentView: (view) => {
    const { isAuthenticated, workspaces } = get();
    let targetView = view;
    let isCorrection = false;
    
    if (isAuthenticated && (targetView === 'landing' || targetView === 'login')) {
      targetView = 'dashboard';
      isCorrection = true;
    }

    if (!isAuthenticated && !['landing', 'login', 'setup'].includes(targetView)) {
      targetView = 'landing';
      isCorrection = true;
    }

    // Block creation views if no workspaces exist
    if (isAuthenticated && workspaces.length === 0 && ['editor', 'snippets', 'connections'].includes(targetView)) {
      get().showAlert(
        'Workspace Required',
        'You must create at least one workspace before you can access this section.'
      );
      targetView = 'dashboard';
      isCorrection = true;
    }

    if (typeof window !== 'undefined') {
      const path = targetView === 'landing' ? '/' : `/${targetView}`;
      if (window.location.pathname !== path) {
        if (isCorrection) {
          history.replaceState({ view: targetView }, "", path);
        } else {
          history.pushState({ view: targetView }, "", path);
        }
      }
    }
    set({ currentView: targetView });
  },
  
  // Active entities
  activeNoteId: null,
  setActiveNoteId: (id) => set({ activeNoteId: id }),
  activeSnippetId: null,
  setActiveSnippetId: (id) => set({ activeSnippetId: id }),
  activeConnectionId: null,
  setActiveConnectionId: (id) => set({ activeConnectionId: id }),
  activeWorkspaceId: null,
  setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
  
  // UI State
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  rightPanelOpen: false,
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  workspaceManagerOpen: false,
  setWorkspaceManagerOpen: (open) => set({ workspaceManagerOpen: open }),
  groupManagerOpen: false,
  setGroupManagerOpen: (open) => set({ groupManagerOpen: open }),
  
  // Data
  notes: [],
  snippets: [],
  workspaces: [],
  groups: [],
  connections: [],
  recentActivity: [],
  notifications: [],

  activeGroupId: null,
  setActiveGroupId: (id) => set({ activeGroupId: id }),

  // Load all data
  loadData: async () => {
    const isAuth = get().isAuthenticated;
    if (!isAuth) return;

    try {
      const workspaces = await api.workspaces.getAll();
      const activeWorkspace = workspaces.find(w => w.isActive) || workspaces[0];
      const activeId = activeWorkspace?.id || null;

      if (!activeId) {
        set({ workspaces: [], notes: [], snippets: [], groups: [], connections: [], activeWorkspaceId: null });
        return;
      }

      const [notes, snippets, groups, connections, notifications, recentActivity] = await Promise.all([
        api.notes.getAll(activeId),
        api.snippets.getAll(activeId),
        api.groups.getAll(activeId),
        api.connections.getAll(activeId),
        api.notifications.getAll(),
        api.activities.getAll(),
      ]);

      set({
        workspaces,
        activeWorkspaceId: activeId,
        notes: notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
        snippets: snippets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
        groups,
        connections,
        notifications,
        recentActivity,
      });

      if (notifications.length === 0) {
        const welcomeShown = typeof window !== 'undefined' ? localStorage.getItem('orqelis-welcome-shown') : 'true';
        if (!welcomeShown) {
          setTimeout(() => {
            get().addNotification({
              title: 'Welcome to Orqelis',
              message: 'Explore your new organized development space. Create notes, snippets and manage workspaces.',
              type: 'info',
            });
            if (typeof window !== 'undefined') {
              localStorage.setItem('orqelis-welcome-shown', 'true');
            }
          }, 1000);
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  },

  // Group actions
  createGroup: async (data) => {
    const activeId = get().activeWorkspaceId;
    if (!activeId) throw new Error('No active workspace');
    
    const group = await api.groups.create({ ...data, workspaceId: activeId });
    set((state) => ({ groups: [...state.groups, group].sort((a, b) => a.name.localeCompare(b.name)) }));
    return group;
  },

  updateGroup: async (id, updates) => {
    const updated = await api.groups.update(id, updates);
    set((state) => ({ groups: state.groups.map((g) => (g.id === id ? updated : g)) }));
  },

  deleteGroup: async (id) => {
    await api.groups.remove(id);
    set((state) => ({
      groups: state.groups.filter((g) => g.id !== id),
      notes: state.notes.map((n) => (n.groupId === id ? { ...n, groupId: null, updatedAt: new Date() } : n)),
      activeGroupId: state.activeGroupId === id ? null : state.activeGroupId,
    }));
  },

  assignNoteToGroup: async (noteId, groupId) => {
    const updated = await api.notes.assignGroup(noteId, groupId);
    set((state) => ({ notes: state.notes.map((n) => n.id === noteId ? updated : n) }));
  },

  assignSnippetToGroup: async (snippetId, groupId) => {
    const updated = await api.snippets.assignGroup(snippetId, groupId);
    set((state) => ({ snippets: state.snippets.map((s) => s.id === snippetId ? updated : s) }));
  },
  
  // Note actions
  createNote: async (noteData) => {
    const activeId = get().activeWorkspaceId;
    if (!activeId) throw new Error('No active workspace');

    const note = await api.notes.create({ ...noteData, workspaceId: activeId });
    await get().logActivity({
      type: 'create',
      entityType: 'note',
      entityId: note.id,
      entityTitle: note.title,
    });
    
    set((state) => ({ notes: [note, ...state.notes] }));
    return note;
  },
  
  updateNote: async (id, updates) => {
    const updated = await api.notes.update(id, updates);
    set((state) => ({
      notes: state.notes.map((n) => n.id === id ? updated : n)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    }));
  },
  
  deleteNote: async (id) => {
    const note = get().notes.find(n => n.id === id);
    await api.notes.remove(id);
    
    if (note) {
      await get().logActivity({
        type: 'delete',
        entityType: 'note',
        entityId: id,
        entityTitle: note.title,
      });
    }
    
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
      activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
    }));
  },
  
  toggleNoteFavorite: async (id) => {
    const note = get().notes.find(n => n.id === id);
    if (note) {
      const updated = await api.notes.update(id, { isFavorite: !note.isFavorite });
      set((state) => ({ notes: state.notes.map((n) => n.id === id ? updated : n) }));
    }
  },
  
  // Snippet actions
  createSnippet: async (snippetData) => {
    const activeId = get().activeWorkspaceId;
    if (!activeId) throw new Error('No active workspace');

    const snippet = await api.snippets.create({ ...snippetData, workspaceId: activeId });
    set((state) => ({ snippets: [snippet, ...state.snippets] }));
    return snippet;
  },
  
  updateSnippet: async (id, updates) => {
    const updated = await api.snippets.update(id, updates);
    set((state) => ({ snippets: state.snippets.map((s) => s.id === id ? updated : s) }));
  },
  
  deleteSnippet: async (id) => {
    await api.snippets.remove(id);
    set((state) => ({ snippets: state.snippets.filter((s) => s.id !== id) }));
  },
  
  incrementSnippetUsage: async (id) => {
    const updated = await api.snippets.incrementUsage(id);
    set((state) => ({ snippets: state.snippets.map((s) => s.id === id ? updated : s) }));
  },

  createConnection: async (data, credentialsData) => {
    const activeId = get().activeWorkspaceId;
    if (!activeId) throw new Error('No active workspace');

    const conn = await api.connections.create({ ...data, workspaceId: activeId, credentials: credentialsData });
    set((state) => ({ connections: [...state.connections, conn] }));
    return conn;
  },

  updateConnection: async (id, updates, credentialsData) => {
    const conn = await api.connections.update(id, { ...updates, credentials: credentialsData });
    set((state) => ({ connections: state.connections.map(c => c.id === id ? conn : c) }));
  },

  deleteConnection: async (id) => {
    await api.connections.remove(id);
    set((state) => ({ connections: state.connections.filter(c => c.id !== id) }));
  },

  linkConnectionAndNote: async (connId, noteId) => {
    const conn = get().connections.find(c => c.id === connId);
    if (conn) {
      const newNoteIds = Array.from(new Set([...(conn.noteIds || []), noteId]));
      await get().updateConnection(connId, { noteIds: newNoteIds });
    }
  },

  unlinkConnectionAndNote: async (connId, noteId) => {
    const conn = get().connections.find(c => c.id === connId);
    if (conn) {
      const newNoteIds = (conn.noteIds || []).filter(id => id !== noteId);
      await get().updateConnection(connId, { noteIds: newNoteIds });
    }
  },

  linkConnectionAndSnippet: async (connId, snippetId) => {
    const conn = get().connections.find(c => c.id === connId);
    if (conn) {
      const newSnippetIds = Array.from(new Set([...(conn.snippetIds || []), snippetId]));
      await get().updateConnection(connId, { snippetIds: newSnippetIds });
    }
  },

  unlinkConnectionAndSnippet: async (connId, snippetId) => {
    const conn = get().connections.find(c => c.id === connId);
    if (conn) {
      const newSnippetIds = (conn.snippetIds || []).filter(id => id !== snippetId);
      await get().updateConnection(connId, { snippetIds: newSnippetIds });
    }
  },

  // Relations
  linkNoteAndSnippet: async (noteId, snippetId) => {
    const note = get().notes.find(n => n.id === noteId);
    const snippet = get().snippets.find(s => s.id === snippetId);
    
    if (note && snippet) {
      const newSnippetIds = Array.from(new Set([...(note.snippetIds || []), snippetId]));
      const newNoteIds = Array.from(new Set([...(snippet.noteIds || []), noteId]));
      
      await get().updateNote(noteId, { snippetIds: newSnippetIds });
      await get().updateSnippet(snippetId, { noteIds: newNoteIds });
    }
  },

  unlinkNoteAndSnippet: async (noteId, snippetId) => {
    const note = get().notes.find(n => n.id === noteId);
    const snippet = get().snippets.find(s => s.id === snippetId);
    
    if (note && snippet) {
      const newSnippetIds = (note.snippetIds || []).filter(id => id !== snippetId);
      const newNoteIds = (snippet.noteIds || []).filter(id => id !== noteId);
      
      await get().updateNote(noteId, { snippetIds: newSnippetIds });
      await get().updateSnippet(snippetId, { noteIds: newNoteIds });
    }
  },
  
  // Workspace actions
  createWorkspace: async (workspaceData) => {
    const workspace = await api.workspaces.create(workspaceData);
    set((state) => ({ workspaces: [...state.workspaces, workspace] }));
    return workspace;
  },
  
  updateWorkspace: async (id, updates) => {
    const updated = await api.workspaces.update(id, updates);
    set((state) => ({ workspaces: state.workspaces.map((w) => w.id === id ? updated : w) }));
  },
  
  deleteWorkspace: async (id) => {
    await api.workspaces.remove(id);
    const state = get();
    set((state) => ({ workspaces: state.workspaces.filter((w) => w.id !== id) }));
    
    if (state.activeWorkspaceId === id) {
      const nextWorkspace = get().workspaces[0];
      if (nextWorkspace) {
        await get().switchWorkspace(nextWorkspace.id);
      } else {
        set({ activeWorkspaceId: null });
      }
    }
  },

  switchWorkspace: async (id) => {
    await api.workspaces.activate(id);
    await get().loadData();
  },
  
  // Activity logging
  logActivity: async (activity) => {
    try {
      const newActivity = await api.activities.create({
        ...activity,
        id: generateId()
      });
      set((state) => ({
        recentActivity: [newActivity, ...state.recentActivity].slice(0, 50),
      }));
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  },

  // Notifications actions
  addNotification: async (notificationData) => {
    try {
      const n = await api.notifications.create(notificationData);
      set((state) => ({ notifications: [n, ...state.notifications] }));
    } catch (err) {
      console.error('Failed to create notification:', err);
    }
  },

  markNotificationAsRead: async (id) => {
    const updated = await api.notifications.markRead(id);
    set((state) => ({ notifications: state.notifications.map((n) => n.id === id ? updated : n) }));
  },

  markAllNotificationsAsRead: async () => {
    await api.notifications.markAllRead();
    set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })) }));
  },

  deleteNotification: async (id) => {
    await api.notifications.remove(id);
    set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) }));
  },

  clearNotifications: async () => {
    await api.notifications.clear();
    set({ notifications: [] });
  },

  // Settings actions
  theme: (typeof window !== 'undefined' ? localStorage.getItem('orqelis-theme') as 'dark' | 'light' : 'dark') || 'dark',
  setTheme: (theme) => {
    localStorage.setItem('orqelis-theme', theme);
    set({ theme });
  },
  accentColor: (typeof window !== 'undefined' ? localStorage.getItem('orqelis-accent-color') : '#22d3ee') || '#22d3ee',
  setAccentColor: (color) => {
    localStorage.setItem('orqelis-accent-color', color);
    set({ accentColor: color });
  },
  language: (typeof window !== 'undefined' ? localStorage.getItem('orqelis-language') as Language : 'en') || 'en',
  setLanguage: (language) => {
    localStorage.setItem('orqelis-language', language);
    set({ language });
  },
  settingsActiveTab: 'general',
  setSettingsActiveTab: (tab) => set({ settingsActiveTab: tab }),

  // Auth State
  user: (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('orqelis-user') || 'null') : null),
  token: (typeof window !== 'undefined' ? localStorage.getItem('orqelis-token') : null),
  isAuthenticated: (typeof window !== 'undefined' ? !!localStorage.getItem('orqelis-token') : false),
  login: async (token, user) => {
    if (!user || !user.id) {
      throw new Error('Login failed: Invalid user data received');
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('orqelis-token', token);
      localStorage.setItem('orqelis-user', JSON.stringify(user));
      history.pushState({ view: 'dashboard' }, "", "/dashboard");
    }
    
    set({ 
      token, 
      user, 
      isAuthenticated: true, 
      currentView: 'dashboard',
      notes: [], snippets: [], workspaces: [], groups: [], connections: [], recentActivity: [], notifications: []
    });
    
    await get().loadData();
  },
  logout: async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('orqelis-token');
      localStorage.removeItem('orqelis-user');
      history.pushState({ view: 'landing' }, "", "/");
    }
    
    set({ 
      token: null, 
      user: null, 
      isAuthenticated: false, 
      currentView: 'landing', 
      notes: [], snippets: [], workspaces: [], groups: [], connections: [], recentActivity: [], notifications: []
    });
  },
  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const user = await api.auth.getMe();
      
      if (user && user.id) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('orqelis-user', JSON.stringify(user));
        }

        const newState: any = { 
          user, 
          token: get().token,
          isAuthenticated: true, 
          isCheckingAuth: false
        };
        
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        if (get().currentView === 'landing' || get().currentView === 'login' || currentPath === '/') {
          newState.currentView = 'dashboard';
          if (typeof window !== 'undefined' && window.location.pathname !== '/dashboard') {
            history.replaceState({ view: 'dashboard' }, "", "/dashboard");
          }
        }
        
        set(newState);
        await get().loadData();
      } else {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('orqelis-token');
          localStorage.removeItem('orqelis-user');
        }
        set({ isCheckingAuth: false, isAuthenticated: false, user: null, token: null });
      }
    } catch (err) {
      console.error('Auth check error:', err);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('orqelis-token');
        localStorage.removeItem('orqelis-user');
      }
      set({ isCheckingAuth: false, isAuthenticated: false, user: null, token: null });
    }
  },

  // Connection Status
  isServerOnline: true,
  isDbOnline: true,
  setServerOnline: (online) => set({ isServerOnline: online }),
  setDbOnline: (online) => set({ isDbOnline: online }),
  showConnectionModal: false,
  setShowConnectionModal: (show) => set({ showConnectionModal: show }),

  isCheckingAuth: true,
  
  // Dialogs
  alertDialog: {
    show: false,
    title: '',
    message: '',
    type: 'alert',
  },

  showAlert: (title, message, confirmLabel) => set({
    alertDialog: { show: true, title, message, type: 'alert', confirmLabel, onConfirm: () => get().hideAlert() }
  }),

  showConfirm: (title, message, onConfirm, onCancel, confirmLabel, cancelLabel) => set({
    alertDialog: {
      show: true, title, message, type: 'confirm', confirmLabel, cancelLabel,
      onConfirm: () => { onConfirm(); get().hideAlert(); },
      onCancel: () => { if (onCancel) onCancel(); get().hideAlert(); }
    }
  }),

  hideAlert: () => set((state) => ({ alertDialog: { ...state.alertDialog, show: false } })),

  // Setup
  needsSetup: false,
  isCheckingSetup: true,
  systemStatus: null,
  checkSetup: async (refresh = false) => {
    set({ isCheckingSetup: true });
    try {
      const status = await api.setup.getStatus(refresh);
      set({ 
        needsSetup: !status.configured, 
        systemStatus: status,
        isCheckingSetup: false 
      });
      
      if (!status.configured) {
        set({ currentView: 'setup' });
      } else if (!status.ready) {
        // System is configured but not ready (e.g. DB error or missing tables after update)
        // We'll handle this in App.tsx
      }
    } catch (error) {
      console.error('Failed to check setup status:', error);
      set({ isCheckingSetup: false });
    }
  },
}));

// Keyboard shortcuts
if (typeof window !== 'undefined') {
  document.addEventListener('keydown', (e) => {
    const isMod = e.metaKey || e.ctrlKey;

    if (isMod && e.key === 'k') {
      e.preventDefault();
      useAppStore.getState().setCommandPaletteOpen(true);
    }
    
    if (isMod && e.key === 'n') {
      e.preventDefault();
      useAppStore.getState().setActiveNoteId(null);
      useAppStore.getState().setCurrentView('editor');
    }

    if (isMod && e.key === 'b') {
      e.preventDefault();
      useAppStore.getState().toggleSidebar();
    }

    if (e.ctrlKey && e.altKey && /^[1-9]$/.test(e.key)) {
      e.preventDefault();
      const index = parseInt(e.key) - 1;
      const workspaces = useAppStore.getState().workspaces;
      if (workspaces[index]) {
        useAppStore.getState().switchWorkspace(workspaces[index].id);
      }
    }

    if (e.key === 'Escape') {
      useAppStore.getState().setCommandPaletteOpen(false);
    }
  });
}
