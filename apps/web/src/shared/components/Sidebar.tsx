import { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Terminal,
  Share2,
  Code2,
  Settings,
  Star,
  Clock,
  FolderOpen,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  Layers,
  Settings2,
  Edit3,
  Trash2,
  Check,
  Laptop
} from 'lucide-react';
import { cn } from '@/shared/utils';
import { useAppStore, type ViewType } from '@/shared/store';
import { motion, AnimatePresence } from 'motion/react';
import { GroupManager } from '@/features/groups/GroupManager';
import { WorkspaceManager } from '@/features/workspaces/WorkspaceManager';
import { t } from '@/shared/i18n';

export function Sidebar() {
  const {
    currentView,
    setCurrentView,
    sidebarCollapsed,
    toggleSidebar,
    notes,
    groups,
    activeGroupId,
    setActiveGroupId,
    deleteGroup,
    setActiveNoteId,
    setCommandPaletteOpen,
    workspaces,
    activeWorkspaceId,
    language,
    workspaceManagerOpen,
    setWorkspaceManagerOpen,
    groupManagerOpen,
    setGroupManagerOpen,
  } = useAppStore();

  const navItems: { id: ViewType; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: t('dashboard', language), icon: LayoutDashboard },
    { id: 'editor', label: t('notes', language), icon: FileText },
    { id: 'graph', label: t('graphView', language), icon: Share2 },
    { id: 'snippets', label: t('snippets', language), icon: Code2 },
    { id: 'connections', label: t('connectionsAndAccess', language), icon: Laptop },
    { id: 'console', label: t('devConsole', language), icon: Terminal },
  ];

  const [pendingDeleteGroup, setPendingDeleteGroup] = useState<string | null>(null);

  const favoriteNotes = notes.filter(n => n.isFavorite);
  const recentNotes = notes.slice(0, 5);

  const handleSelectGroup = (groupId: string) => {
    setActiveGroupId(activeGroupId === groupId ? null : groupId);
    setCurrentView('editor');
  };

  const handleQuickDeleteGroup = async (groupId: string) => {
    await deleteGroup(groupId);
    setPendingDeleteGroup(null);
  };

  // On mobile (< md): hide the sidebar entirely when collapsed; show as overlay when expanded.
  return (
    <>
    {/* Mobile backdrop */}
    <AnimatePresence>
      {!sidebarCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={toggleSidebar}
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        />
      )}
    </AnimatePresence>
    <aside className={cn(
      "fixed left-0 top-0 h-full bg-surface-container-lowest/80 backdrop-blur-xl border-r border-on-surface/10 flex flex-col z-50 transition-all duration-300",
      sidebarCollapsed
        ? "w-[72px] -translate-x-full md:translate-x-0"
        : "w-[280px] translate-x-0"
    )}>
      {/* Logo */}
      <div className="px-5 py-6 flex items-center gap-3 border-b border-on-surface/5">
        <div 
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 cursor-pointer shrink-0"
          onClick={() => setCurrentView(useAppStore.getState().isAuthenticated ? 'dashboard' : 'landing')}
        >
          <Share2 className="text-background w-5 h-5" />
        </div>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1"
          >
            <h1 className="font-sans text-lg font-bold text-on-surface tracking-tight">Orqelis</h1>
            <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-widest">Technical Knowledge</p>
          </motion.div>
        )}
        {!sidebarCollapsed && (
          <button
            onClick={() => setWorkspaceManagerOpen(true)}
            className="p-2 rounded-lg hover:bg-on-surface/5 text-on-surface-variant/70 hover:text-on-surface transition-colors"
            title={t('manageWorkspaces', language)}
          >
            <Settings2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Workspace Switcher (Condensed) */}
      <div className="px-3 py-2 flex flex-col gap-2">
        {workspaces.map((w) => (
          <button
            key={w.id}
            onClick={() => useAppStore.getState().switchWorkspace(w.id)}
            className={cn(
              "relative flex items-center justify-center transition-all duration-200 group",
              sidebarCollapsed ? "w-10 h-10 mx-auto" : "w-full h-10 px-2 rounded-xl",
              activeWorkspaceId === w.id 
                ? "bg-on-surface/10 rounded-xl shadow-inner" 
                : "hover:bg-on-surface/5 rounded-lg"
            )}
            title={w.name}
          >
            {activeWorkspaceId === w.id && (
              <motion.div 
                layoutId="active-ws"
                className="absolute left-0 w-1 h-6 bg-primary rounded-full"
              />
            )}
            <div 
              className={cn(
                "rounded-lg flex items-center justify-center text-white shrink-0 transition-transform group-hover:scale-110",
                sidebarCollapsed ? "w-8 h-8" : "w-7 h-7 mr-3"
              )}
              style={{ backgroundColor: w.color }}
            >
              <span className="text-[10px] font-bold uppercase">{w.name.substring(0, 2)}</span>
            </div>
            {!sidebarCollapsed && (
              <span className={cn(
                "flex-1 text-left text-xs font-semibold truncate",
                activeWorkspaceId === w.id ? "text-on-surface" : "text-on-surface-variant"
              )}>
                {w.name}
              </span>
            )}
            {!sidebarCollapsed && activeWorkspaceId === w.id && (
              <Check className="w-3 h-3 text-success shrink-0" />
            )}
          </button>
        ))}
        {workspaces.length < 5 && (
           <button
            onClick={() => setWorkspaceManagerOpen(true)}
            className={cn(
              "flex items-center justify-center border border-dashed border-on-surface/20 text-on-surface-variant hover:border-primary/50 hover:text-primary transition-all",
              sidebarCollapsed ? "w-8 h-8 mx-auto rounded-lg mt-1" : "w-full py-2 rounded-lg mt-1 gap-2 text-[10px] font-bold uppercase tracking-wider"
            )}
            title={t('newWorkspace', language)}
          >
            <Plus className="w-3 h-3" />
            {!sidebarCollapsed && <span>{t('newWorkspace', language)}</span>}
          </button>
        )}
      </div>

      {/* Quick Search */}
      {!sidebarCollapsed && (
        <div className="px-4 py-4">
          <button 
            onClick={() => setCommandPaletteOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-on-surface/5 border border-on-surface/10 text-on-surface-variant text-sm hover:bg-on-surface/10 hover:border-on-surface/20 transition-all group"
          >
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left">{t('search', language)}</span>
            <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-mono bg-on-surface/10 rounded border border-on-surface/10">
              <span className="text-[10px]">Ctrl</span>+K
            </kbd>
          </button>
        </div>
      )}

      {/* New Note Button */}
      <div className={cn("px-4", sidebarCollapsed ? "py-4" : "pb-4")}>
        <button 
          onClick={() => {
            setCurrentView('editor');
            setActiveNoteId(null);
          }}
          className={cn(
            "btn-glow bg-gradient-to-r from-primary to-secondary text-background font-semibold rounded-xl flex items-center justify-center gap-2 transition-all",
            sidebarCollapsed ? "w-10 h-10" : "w-full py-3",
            workspaces.length === 0 && "opacity-50 grayscale cursor-not-allowed"
          )}
        >
          <Plus className="w-5 h-5" />
          {!sidebarCollapsed && <span>{t('newNote', language)}</span>}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        <div className={cn("mb-2", !sidebarCollapsed && "px-2")}>
          {!sidebarCollapsed && (
            <span className="text-[10px] font-bold font-mono text-on-surface-variant/50 uppercase tracking-widest">
              {t('navigation', language)}
            </span>
          )}
        </div>
        
        {navItems.map((item) => {
          const isCreationView = ['editor', 'graph', 'snippets', 'connections'].includes(item.id);
          const isBlocked = workspaces.length === 0 && isCreationView;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                currentView === item.id 
                  ? "bg-primary/15 text-primary border-l-2 border-primary" 
                  : "text-on-surface-variant hover:bg-on-surface/5 hover:text-on-surface border-l-2 border-transparent",
                isBlocked && "opacity-50 grayscale cursor-not-allowed"
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", currentView === item.id && "text-primary")} />
              {!sidebarCollapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
            </button>
          );
        })}

        {/* Groups */}
        {!sidebarCollapsed && (
          <div className="mt-8">
            <div className="px-2 mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-3 h-3 text-on-surface-variant/60" />
                <span className="text-[10px] font-bold font-mono text-on-surface-variant/50 uppercase tracking-widest">
                  {t('groups', language)}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => {
                    if (workspaces.length === 0) {
                      useAppStore.getState().showAlert('Workspace Required', 'You must create at least one workspace before you can manage groups.');
                      return;
                    }
                    setGroupManagerOpen(true);
                  }}
                  className={cn(
                    "p-1 rounded hover:bg-on-surface/10 text-on-surface-variant/70 hover:text-on-surface",
                    workspaces.length === 0 && "opacity-50 cursor-not-allowed"
                  )}
                  title={t('manageGroups', language)}
                >
                  <Settings2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    if (workspaces.length === 0) {
                      useAppStore.getState().showAlert('Workspace Required', 'You must create at least one workspace before you can create groups.');
                      return;
                    }
                    setGroupManagerOpen(true);
                  }}
                  className={cn(
                    "p-1 rounded hover:bg-on-surface/10 text-on-surface-variant/70 hover:text-on-surface",
                    workspaces.length === 0 && "opacity-50 cursor-not-allowed"
                  )}
                  title={t('newGroup', language)}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveGroupId(null);
                setCurrentView('editor');
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm',
                activeGroupId === null && currentView === 'editor'
                  ? 'bg-on-surface/10 text-on-surface'
                  : 'text-on-surface-variant hover:bg-on-surface/5 hover:text-on-surface'
              )}
            >
              <FolderOpen className="w-4 h-4 shrink-0 text-on-surface-variant/60" />
              <span className="flex-1 text-left truncate">{t('allNotes', language)}</span>
              <span className="text-[10px] font-mono text-on-surface-variant/50">{notes.length}</span>
            </button>

            {groups.map((group) => {
              const count = notes.filter((n) => n.groupId === group.id).length;
              const isActive = activeGroupId === group.id;
              const isPending = pendingDeleteGroup === group.id;
              return (
                <div key={group.id} className="group/grp relative">
                  <button
                    onClick={() => handleSelectGroup(group.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm',
                      isActive
                        ? 'bg-primary/15 text-primary'
                        : 'text-on-surface-variant hover:bg-on-surface/5 hover:text-on-surface'
                    )}
                    title={group.description}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="flex-1 text-left truncate">{group.name}</span>
                    <span className="text-[10px] font-mono text-on-surface-variant/50 group-hover/grp:hidden">{count}</span>
                  </button>
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 hidden group-hover/grp:flex items-center gap-0.5 bg-surface-container-lowest/95 backdrop-blur rounded-md px-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setGroupManagerOpen(true);
                      }}
                      className="p-1 rounded hover:bg-on-surface/10 text-on-surface-variant hover:text-on-surface"
                      title={t('editGroup', language)}
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDeleteGroup(isPending ? null : group.id);
                      }}
                      className={cn(
                        'p-1 rounded hover:bg-error/20 text-on-surface-variant hover:text-error',
                        isPending && 'bg-error/20 text-error'
                      )}
                      title={t('deleteGroup', language).replace('group', 'grupo')}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  {isPending && (
                    <div className="mx-2 mt-1 mb-1 p-2 rounded-md bg-error/10 border border-error/20">
                      <p className="text-[10px] text-error mb-1.5">{t('deleteGroupConfirm', language).split('?')[0]} "{group.name}"?</p>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setPendingDeleteGroup(null)}
                          className="flex-1 px-2 py-0.5 text-[10px] rounded hover:bg-on-surface/10 text-on-surface-variant"
                        >
                          {t('cancel', language)}
                        </button>
                        <button
                          onClick={() => handleQuickDeleteGroup(group.id)}
                          className="flex-1 px-2 py-0.5 text-[10px] rounded bg-error/80 hover:bg-error text-background font-medium"
                        >
                          {t('delete', language)}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {groups.length === 0 && (
              <button
                onClick={() => setGroupManagerOpen(true)}
                className="w-full px-3 py-2 text-xs text-on-surface-variant/60 hover:text-on-surface-variant text-left rounded-lg hover:bg-on-surface/5"
              >
                {t('noGroupsYet', language)}
              </button>
            )}

            {groups.length > 0 && (
              <button
                onClick={() => setGroupManagerOpen(true)}
                className="w-full mt-1 flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] text-on-surface-variant/70 hover:text-on-surface hover:bg-on-surface/5 transition-all"
              >
                <Settings2 className="w-3 h-3" />
                {t('manageGroups', language)}
              </button>
            )}
          </div>
        )}

        {/* Favorites */}
        {!sidebarCollapsed && favoriteNotes.length > 0 && (
          <div className="mt-8">
            <div className="px-2 mb-2 flex items-center gap-2">
              <Star className="w-3 h-3 text-warning" />
              <span className="text-[10px] font-bold font-mono text-on-surface-variant/50 uppercase tracking-widest">
                {t('favorites', language)}
              </span>
            </div>
            {favoriteNotes.slice(0, 4).map((note) => (
              <button
                key={note.id}
                onClick={() => {
                  setActiveNoteId(note.id);
                  setCurrentView('editor');
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-on-surface/5 hover:text-on-surface transition-all text-sm truncate"
              >
                <FileText className="w-4 h-4 shrink-0 text-on-surface-variant/60" />
                <span className="truncate">{note.title}</span>
              </button>
            ))}
          </div>
        )}

        {/* Recent */}
        {!sidebarCollapsed && recentNotes.length > 0 && (
          <div className="mt-6">
            <div className="px-2 mb-2 flex items-center gap-2">
              <Clock className="w-3 h-3 text-on-surface-variant/60" />
              <span className="text-[10px] font-bold font-mono text-on-surface-variant/50 uppercase tracking-widest">
                {t('recent', language)}
              </span>
            </div>
            {recentNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => {
                  setActiveNoteId(note.id);
                  setCurrentView('editor');
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-on-surface/5 hover:text-on-surface transition-all text-sm truncate"
              >
                <FileText className="w-4 h-4 shrink-0 text-on-surface-variant/60" />
                <span className="truncate">{note.title}</span>
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto border-t border-on-surface/5 p-3 space-y-1">

        <button 
          onClick={() => setCurrentView('settings')}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
            currentView === 'settings' 
              ? "bg-primary/15 text-primary" 
              : "text-on-surface-variant hover:bg-on-surface/5"
          )}
          title={sidebarCollapsed ? t('settings', language) : undefined}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!sidebarCollapsed && <span className="font-medium text-sm">{t('settings', language)}</span>}
        </button>
        
        <button 
          onClick={toggleSidebar}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-on-surface/5 transition-all"
          title={sidebarCollapsed ? t('expand', language) : t('collapse', language)}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">{t('collapse', language)}</span>
            </>
          )}
        </button>
      </div>
    </aside>
    <GroupManager open={groupManagerOpen} onClose={() => setGroupManagerOpen(false)} />
    <WorkspaceManager open={workspaceManagerOpen} onClose={() => setWorkspaceManagerOpen(false)} />
    </>
  );
}
