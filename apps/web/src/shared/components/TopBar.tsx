import { Search, Bell, User, Moon, Sun, Menu } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/shared/utils';
import { useAppStore, type ViewType } from '@/shared/store';
import { NotificationCenter } from './NotificationCenter';
import { t } from '@/shared/i18n';

export function TopBar() {
  const { 
    currentView, 
    setCommandPaletteOpen,
    sidebarCollapsed,
    toggleSidebar,
    theme,
    setTheme,
    workspaces,
    activeWorkspaceId,
    notifications,
    language,
    user,
    isAuthenticated,
    setSettingsActiveTab,
    setCurrentView
  } = useAppStore();

  const handleProfileClick = () => {
    setSettingsActiveTab('account');
    setCurrentView('settings');
  };


  const viewTitles: Record<ViewType, string> = {
    landing: t('welcome', language),
    dashboard: t('dashboard', language),
    editor: t('notes', language),
    graph: t('graphView', language),
    console: t('devConsole', language),
    snippets: t('snippets', language),
    connections: t('connectionsAndAccess', language),
    settings: t('settings', language),
    search: t('search', language),
    setup: t('setup', language),
    login: 'Login',
  };

  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const unreadCount = notifications.filter(n => !n.read && (!n.workspaceId || n.workspaceId === activeWorkspaceId)).length;

  return (
    <header className={cn(
      "fixed top-0 right-0 left-0 h-14 bg-surface/60 backdrop-blur-xl border-b border-on-surface/5 z-40 flex items-center justify-between px-4 sm:px-6 transition-all duration-300",
      sidebarCollapsed ? "md:left-[72px]" : "md:left-[280px]"
    )}>
      {/* Left: Breadcrumb / Title */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 -ml-1 rounded-lg hover:bg-on-surface/5 text-on-surface-variant transition-colors"
          aria-label={t('toggleSidebarLabel', language)}
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-base sm:text-lg font-semibold text-on-surface truncate">
          {viewTitles[currentView]}
          {activeWorkspace && (
            <span className="ml-2 text-xs font-normal text-on-surface-variant hidden sm:inline-flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: activeWorkspace.color }} />
              {activeWorkspace.name}
            </span>
          )}
        </h2>
        {currentView !== 'landing' && (
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-on-surface-variant/60">
            <span className={cn(
              "w-1.5 h-1.5 rounded-full",
              isAuthenticated ? "bg-success" : "bg-warning"
            )} />
            <span>
              {isAuthenticated 
                ? (language === 'es' ? 'Conectado' : 'Connected') 
                : t('localStorageActive', language)
              }
            </span>
          </div>
        )}
      </div>

      {/* Right: Search + Actions */}
      <div className="flex items-center gap-1">
        {/* Search */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-on-surface/5 border border-on-surface/10 text-on-surface-variant text-sm hover:bg-on-surface/10 hover:border-on-surface/20 transition-all"
        >
          <Search className="w-4 h-4" />
          <span className="hidden md:inline">{t('searchNotes', language)}</span>
          <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono bg-on-surface/10 rounded border border-on-surface/10">
            <span>Ctrl</span>
            <span>+</span>
            <span>K</span>
          </kbd>
        </button>

        {/* Mobile Search */}
        <button 
          onClick={() => setCommandPaletteOpen(true)}
          className="sm:hidden p-2 rounded-lg hover:bg-on-surface/5 text-on-surface-variant transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-lg hover:bg-on-surface/5 text-on-surface-variant transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-surface" />
            )}
          </button>

          <NotificationCenter 
            isOpen={notificationsOpen} 
            onClose={() => setNotificationsOpen(false)} 
          />
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg hover:bg-on-surface/5 text-on-surface-variant transition-colors"
          title={theme === 'dark' ? t('switchToLight', language) : t('switchToDark', language)}
        >
          {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        {/* User */}
        {isAuthenticated ? (
          <button 
            onClick={handleProfileClick}
            className="flex items-center gap-3 p-1.5 pr-3 rounded-lg hover:bg-on-surface/5 text-on-surface transition-all group"
            title="Profile"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center border border-on-surface/10 group-hover:border-error/20">
              {user?.image ? (
                <img 
                  src={user.image} 
                  alt="" 
                  className="w-full h-full rounded-lg object-cover" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement?.classList.add('fallback-active');
                  }}
                />
              ) : null}
              <div className={cn(
                "hidden items-center justify-center",
                (!user?.image) ? "flex" : "[.fallback-active~&]:flex"
              )}>
                <User className="w-4 h-4 text-primary group-hover:text-error" />
              </div>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium truncate max-w-[100px]">{user?.name || t('developer', language)}</p>
              <p className="text-[10px] font-mono opacity-60 uppercase flex items-center gap-1">
                <User className="w-3 h-3" />
                {language === 'es' ? 'Perfil' : 'Profile'}
              </p>
            </div>
          </button>
        ) : (
          <button 
            onClick={() => useAppStore.getState().setCurrentView('login')}
            className="flex items-center gap-3 p-1.5 pr-3 rounded-lg hover:bg-primary/10 text-on-surface transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-on-surface/5 flex items-center justify-center border border-on-surface/10 group-hover:border-primary/20">
              <User className="w-4 h-4 text-on-surface-variant group-hover:text-primary" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium">Guest</p>
              <p className="text-[10px] font-mono text-on-surface-variant uppercase">Sign In</p>
            </div>
          </button>
        )}
      </div>
    </header>
  );
}
