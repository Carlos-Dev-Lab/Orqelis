import { useEffect, Suspense, lazy } from 'react';
import { useAppStore } from '@/shared/store';
import { Sidebar } from '@/shared/components/Sidebar';
import { TopBar } from '@/shared/components/TopBar';
import { Landing } from '@/features/auth/Landing';
import { Login } from '@/features/auth/Login';
import { SetupWizard } from '@/features/setup/SetupWizard';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { CommandPalette } from '@/shared/components/CommandPalette';
import { ConnectionStatusModal } from '@/features/connections/ConnectionStatusModal';
import { AlertDialog } from '@/shared/components/AlertDialog';
import { cn } from '@/shared/utils';
import { t } from '@/shared/i18n';

// Lazy load heavy components
const NotesView = lazy(() => import('@/features/notes/NotesView'));
const GraphView = lazy(() => import('@/features/graph/GraphView'));
const DevConsole = lazy(() => import('@/shared/components/DevConsole'));
const SnippetsView = lazy(() => import('@/features/snippets/SnippetsView'));
const SettingsView = lazy(() => import('@/features/settings/SettingsView'));
const ConnectionsView = lazy(() => import('@/features/connections/ConnectionsView').then(m => ({ default: m.ConnectionsView })));

function LoadingView() {
  const { language } = useAppStore();
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 animate-pulse">
          <svg className="w-6 h-6 text-background animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <p className="text-on-surface-variant font-mono text-sm">{t('loading', language)}</p>
      </div>
    </div>
  );
}

function SystemNotReady({ status }: { status: any }) {
  const { language, checkSetup } = useAppStore();
  
  return (
    <div className="h-full flex items-center justify-center p-6 bg-background relative overflow-hidden">
      <div className="aurora-bg opacity-30" />
      <div className="max-w-md w-full glass-card p-8 text-center relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center mx-auto mb-6 text-error">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-on-surface mb-2">
          {status.database === 'error' ? 'Database Connection Error' : 'System Schema Incomplete'}
        </h1>
        
        <p className="text-on-surface-variant mb-6 text-sm">
          {status.details || 'The system is currently unavailable. Please check your configuration and try again.'}
        </p>

        {status.missingTables && (
          <div className="mb-6 p-3 bg-surface/50 rounded-lg text-left">
            <p className="text-xs font-bold text-on-surface-variant uppercase mb-2">Missing Tables:</p>
            <div className="flex flex-wrap gap-1">
              {status.missingTables.map((t: string) => (
                <span key={t} className="px-2 py-0.5 bg-error/20 text-error rounded text-[10px] font-mono">{t}</span>
              ))}
            </div>
          </div>
        )}
        
        <button 
          onClick={() => checkSetup()}
          className="w-full h-10 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          {t('retry', language)}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { 
    currentView, 
    sidebarCollapsed, 
    loadData, 
    toggleSidebar, 
    theme, 
    accentColor, 
    isAuthenticated, 
    checkAuth, 
    checkSetup, 
    needsSetup, 
    setCurrentView,
    isCheckingAuth,
    isCheckingSetup,
    systemStatus
  } = useAppStore();

  // Initialize auth and setup check
  useEffect(() => {
    checkSetup();
    checkAuth();
  }, [checkAuth, checkSetup]);

  // Apply theme and accent color
  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.style.setProperty('--primary', accentColor);
    
    // Also update some other related variables if needed
    // For example, if we want a glow effect to match the accent
    document.documentElement.style.setProperty('--primary-glow', `${accentColor}33`);
  }, [accentColor]);

  // Load data on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [loadData, isAuthenticated]);

  // Route protection and redirects
  useEffect(() => {
    if (isCheckingAuth) return;

    const path = typeof window !== 'undefined' ? window.location.pathname : '';

    // Authenticated users should not be on public pages or at the root
    if (isAuthenticated) {
      if ((currentView === 'login' || currentView === 'landing' || path === '/') && currentView !== 'dashboard') {
        setCurrentView('dashboard');
      }
    } else {
      // Unauthenticated users should not be on protected pages
      if (!['landing', 'login', 'setup'].includes(currentView)) {
        setCurrentView('landing');
      }
    }
  }, [isAuthenticated, isCheckingAuth, currentView, setCurrentView]);

  // Collapse sidebar on mobile when view changes to avoid covering content
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches && !sidebarCollapsed) {
      toggleSidebar();
    }
  }, [currentView]);

  // Handle browser back/forward buttons
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handlePopState = () => {
      const path = (window.location.pathname.replace('/', '') as any) || 'landing';
      if (path !== currentView) {
        // Use a flag or check if it's a valid view
        const validViews = ['landing', 'dashboard', 'editor', 'graph', 'console', 'snippets', 'settings', 'search', 'setup', 'login', 'connections'];
        if (validViews.includes(path)) {
          setCurrentView(path);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentView, setCurrentView]);

  // Collapse sidebar by default on mobile so it doesn't cover content on first paint
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(max-width: 767px)').matches && !useAppStore.getState().sidebarCollapsed) {
      toggleSidebar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show loading while checking auth or setup
  if (isCheckingAuth || isCheckingSetup) {
    return <LoadingView />;
  }

  // System not ready (DB error or schema missing)
  if (systemStatus && !systemStatus.ready && systemStatus.configured) {
    return <SystemNotReady status={systemStatus} />;
  }

  // Landing view without sidebar
  if (currentView === 'landing' && !isAuthenticated) {
    return (
      <>
        <div className="aurora-bg" />
        <div className="noise-overlay" />
        <CommandPalette />
        <ConnectionStatusModal />
        <AlertDialog />
        <Landing />
      </>
    );
  }

  // Force setup if needed
  if (needsSetup || currentView === 'setup') {
    return <SetupWizard />;
  }

  // Force login if not authenticated or specifically on login view
  if ((!isAuthenticated && currentView !== 'landing') || (currentView === 'login' && !isAuthenticated)) {
    return <Login />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'editor':
        return (
          <Suspense fallback={<LoadingView />}>
            <NotesView />
          </Suspense>
        );
      case 'graph':
        return (
          <Suspense fallback={<LoadingView />}>
            <GraphView />
          </Suspense>
        );
      case 'console':
        return (
          <Suspense fallback={<LoadingView />}>
            <DevConsole />
          </Suspense>
        );
      case 'snippets':
        return (
          <Suspense fallback={<LoadingView />}>
            <SnippetsView />
          </Suspense>
        );
      case 'connections':
        return (
          <Suspense fallback={<LoadingView />}>
            <ConnectionsView />
          </Suspense>
        );
      case 'settings':
        return (
          <Suspense fallback={<LoadingView />}>
            <SettingsView />
          </Suspense>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <div className="aurora-bg" />
      <div className="noise-overlay" />
      <CommandPalette />
      <ConnectionStatusModal />
      <AlertDialog />
      <Sidebar />
      <TopBar />
      <main className={cn(
        "pt-14 h-screen transition-all duration-300",
        sidebarCollapsed ? "pl-0 md:pl-[72px]" : "pl-0 md:pl-[280px]"
      )}>
        {renderView()}
      </main>
    </>
  );
}
