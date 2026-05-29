import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  Palette, 
  Keyboard, 
  Moon,
  Sun,
  Check,
  Cloud,
  Users, 
  User,
  HardDrive,
  Menu,
  X,
  Languages
} from 'lucide-react';
import { cn } from '@/shared/utils';
import { useAppStore } from '@/shared/store';
import { t } from '@/shared/i18n';
import { DatabaseSettings } from './DatabaseSettings';
import { AdminPanel } from '@/features/admin/AdminPanel';
import { StorageManager } from './StorageManager';
import { ProfileSection } from './ProfileSection';

function SettingsView() {
  const { 
    notes, 
    snippets,
    theme, 
    setTheme, 
    accentColor, 
    setAccentColor,
    workspaces,
    activeWorkspaceId,
    updateWorkspace,
    language,
    setLanguage,
    user,
    settingsActiveTab: activeTab,
    setSettingsActiveTab: setActiveTab
  } = useAppStore();

  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  // Temporary appearance settings
  const [tempTheme, setTempTheme] = useState(theme);
  const [tempAccentColor, setTempAccentColor] = useState(accentColor);
  const [tempLanguage, setTempLanguage] = useState(language);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const hasAppearanceChanges = tempTheme !== theme || tempAccentColor !== accentColor || tempLanguage !== language;

  const applyAppearanceSettings = () => {
    setSaveStatus('saving');
    setTheme(tempTheme);
    setAccentColor(tempAccentColor);
    setLanguage(tempLanguage);
    
    setTimeout(() => {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const tabs = [
    { id: 'general', label: t('generalSettings', language), icon: Settings },
    { id: 'account', label: language === 'es' ? 'Cuenta' : 'Account', icon: User },
    { id: 'cloud', label: 'Sincronización', icon: Cloud },
    { id: 'appearance', label: t('appearance', language), icon: Palette },
    { id: 'storage', label: language === 'es' ? 'Almacenamiento' : 'Storage', icon: HardDrive },
    { id: 'shortcuts', label: t('keyboardShortcuts', language), icon: Keyboard },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Panel Admin', icon: Users }] : []),
  ];



  const shortcuts = [
    { keys: ['Ctrl', 'K'], description: 'Open command palette' },
    { keys: ['Ctrl', 'N'], description: 'Create new note' },
    { keys: ['Ctrl', 'S'], description: 'Save current note' },
    { keys: ['Ctrl', 'B'], description: 'Toggle sidebar' },
    { keys: ['Ctrl', 'P'], description: 'Toggle preview mode' },
    { keys: ['Esc'], description: 'Close modals/palettes' },
    { keys: ['Tab'], description: 'Autocomplete (console)' },
    { keys: ['↑', '↓'], description: 'Navigate command history' },
  ];

  return (
    <div className="h-[calc(100vh-3.5rem)] flex relative overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSettingsMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSettingsMenuOpen(false)}
            className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-surface-container-lowest/95 backdrop-blur-xl border-r border-on-surface/5 p-4 transform transition-transform duration-300 md:relative md:translate-x-0 md:bg-surface-container-lowest/50",
        isSettingsMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between mb-4 px-3">
          <h2 className="text-lg font-semibold text-on-surface truncate">{t('settings', language)}</h2>
          <button 
            onClick={() => setIsSettingsMenuOpen(false)}
            className="md:hidden p-1 hover:bg-on-surface/5 rounded-full"
          >
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>
        <nav className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsSettingsMenuOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left",
                activeTab === tab.id
                  ? "bg-primary/15 text-primary"
                  : "text-on-surface-variant hover:bg-on-surface/5"
              )}
            >
              <tab.icon className="w-5 h-5 shrink-0" />
              <span className="font-medium text-sm truncate">{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 p-4 sm:p-8 overflow-y-auto custom-scrollbar">
        <div className="max-w-2xl mx-auto md:mx-0">
          {/* Mobile Header Toggle */}
          <div className="md:hidden flex items-center gap-3 mb-6">
            <button
              onClick={() => setIsSettingsMenuOpen(true)}
              className="p-2 bg-on-surface/5 rounded-lg text-on-surface-variant hover:text-primary transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-bold text-on-surface truncate">
              {tabs.find(t => t.id === activeTab)?.label}
            </h3>
          </div>
          {activeTab === 'general' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-xl font-bold text-on-surface mb-6">{t('generalSettings', language)}</h3>
              
              <div className="space-y-6">
                {activeWorkspace && (
                  <div className="glass-card rounded-xl p-6">
                    <h4 className="font-semibold text-on-surface mb-4">{t('workspaceSettings', language)}</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-on-surface-variant mb-2">{t('workspaceName', language)}</label>
                        <input
                          type="text"
                          value={activeWorkspace.name}
                          onChange={(e) => updateWorkspace(activeWorkspace.id, { name: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-lg bg-on-surface/5 border border-on-surface/10 text-on-surface focus:border-primary/50 focus:outline-none transition-colors"
                          placeholder={t('myWorkspacePlaceholder', language)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-on-surface-variant mb-2">{t('description', language)}</label>
                        <textarea
                          value={activeWorkspace.description}
                          onChange={(e) => updateWorkspace(activeWorkspace.id, { description: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-lg bg-on-surface/5 border border-on-surface/10 text-on-surface focus:border-primary/50 focus:outline-none transition-colors resize-none"
                          rows={2}
                          placeholder={t('workspaceDescPlaceholder', language)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="glass-card rounded-xl p-6">
                  <h4 className="font-semibold text-on-surface mb-4">{t('applicationInfo', language)}</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-on-surface-variant">{t('version', language)}</span>
                      <span className="font-mono text-on-surface">1.0.0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-on-surface-variant">{t('storage', language)}</span>
                      <span className="font-mono text-on-surface">Hybrid (IndexedDB + Cloud)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-on-surface-variant">{t('notes', language)}</span>
                      <span className="font-mono text-on-surface">{notes.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-on-surface-variant">{t('snippets', language)}</span>
                      <span className="font-mono text-on-surface">{snippets.length}</span>
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-xl p-6">
                  <h4 className="font-semibold text-on-surface mb-2">{t('aboutOrqelis', language)}</h4>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {t('aboutText', language)}
                  </p>
                </div>
              </div>
            </motion.div>
          )}


          {activeTab === 'account' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-xl font-bold text-on-surface mb-6">{language === 'es' ? 'Administrar Perfil' : 'Manage Profile'}</h3>
              <ProfileSection />
            </motion.div>
          )}

          {activeTab === 'cloud' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-xl font-bold text-on-surface mb-6">Sincronización en la Nube</h3>
              <DatabaseSettings />
            </motion.div>
          )}

          {activeTab === 'admin' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-xl font-bold text-on-surface mb-6">Panel de Administración</h3>
              <AdminPanel />
            </motion.div>
          )}


          {activeTab === 'appearance' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-xl font-bold text-on-surface mb-6">{t('appearance', language)}</h3>
              
              <div className="space-y-6">
                <div className="glass-card rounded-xl p-6">
                  <h4 className="font-semibold text-on-surface mb-4">{t('theme', language)}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      onClick={() => setTempTheme('dark')}
                      className={cn(
                        "p-4 rounded-xl flex flex-col items-center gap-2 transition-all border-2",
                        tempTheme === 'dark' 
                          ? "bg-primary/20 border-primary shadow-lg shadow-primary/10" 
                          : "bg-on-surface/5 border-on-surface/10 hover:bg-on-surface/10"
                      )}
                    >
                      <Moon className={cn("w-6 h-6", tempTheme === 'dark' ? "text-primary" : "text-on-surface-variant")} />
                      <span className="font-medium text-on-surface">{t('dark', language)}</span>
                      {tempTheme === 'dark' && <Check className="w-4 h-4 text-primary" />}
                    </button>
                    <button 
                      onClick={() => setTempTheme('light')}
                      className={cn(
                        "p-4 rounded-xl flex flex-col items-center gap-2 transition-all border-2",
                        tempTheme === 'light' 
                          ? "bg-primary/20 border-primary shadow-lg shadow-primary/10" 
                          : "bg-on-surface/5 border-on-surface/10 hover:bg-on-surface/10"
                      )}
                    >
                      <Sun className={cn("w-6 h-6", tempTheme === 'light' ? "text-primary" : "text-on-surface-variant")} />
                      <span className="font-medium text-on-surface">{t('light', language)}</span>
                      {tempTheme === 'light' && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  </div>
                </div>

                <div className="glass-card rounded-xl p-6">
                  <h4 className="font-semibold text-on-surface mb-4">{t('accentColor', language)}</h4>
                  <p className="text-sm text-on-surface-variant mb-4">
                    {t('accentText', language)}
                  </p>
                  <div className="flex items-center gap-3">
                    {['#22d3ee', '#60a5fa', '#a78bfa', '#34d399', '#fb923c'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setTempAccentColor(color)}
                        className={cn(
                          "w-10 h-10 rounded-xl transition-all relative flex items-center justify-center",
                          tempAccentColor === color && "ring-2 ring-white ring-offset-2 ring-offset-background scale-110"
                        )}
                        style={{ backgroundColor: color }}
                      >
                        {tempAccentColor === color && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="glass-card rounded-xl p-6">
                  <h4 className="font-semibold text-on-surface mb-4">{t('language', language)}</h4>
                  <p className="text-sm text-on-surface-variant mb-4">
                    {t('selectLanguage', language)}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      onClick={() => setTempLanguage('en')}
                      className={cn(
                        "p-4 rounded-xl flex flex-col items-center gap-2 transition-all border-2",
                        tempLanguage === 'en' 
                          ? "bg-primary/20 border-primary shadow-lg shadow-primary/10" 
                          : "bg-on-surface/5 border-on-surface/10 hover:bg-on-surface/10"
                      )}
                    >
                      <Languages className={cn("w-6 h-6", tempLanguage === 'en' ? "text-primary" : "text-on-surface-variant")} />
                      <span className="font-medium text-on-surface">{t('english', language)}</span>
                      {tempLanguage === 'en' && <Check className="w-4 h-4 text-primary" />}
                    </button>
                    <button 
                      onClick={() => setTempLanguage('es')}
                      className={cn(
                        "p-4 rounded-xl flex flex-col items-center gap-2 transition-all border-2",
                        tempLanguage === 'es' 
                          ? "bg-primary/20 border-primary shadow-lg shadow-primary/10" 
                          : "bg-on-surface/5 border-on-surface/10 hover:bg-on-surface/10"
                      )}
                    >
                      <Languages className={cn("w-6 h-6", tempLanguage === 'es' ? "text-primary" : "text-on-surface-variant")} />
                      <span className="font-medium text-on-surface">{t('spanish', language)}</span>
                      {tempLanguage === 'es' && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  </div>
                </div>

                {hasAppearanceChanges && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-end pt-4"
                  >
                    <button
                      onClick={applyAppearanceSettings}
                      disabled={saveStatus === 'saving'}
                      className={cn(
                        "px-6 py-2.5 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2",
                        saveStatus === 'success' 
                          ? "bg-success text-white" 
                          : "bg-primary text-on-primary shadow-primary/20 hover:scale-105"
                      )}
                    >
                      {saveStatus === 'saving' ? (
                        <div className="w-5 h-5 border-2 border-on-surface/30 border-t-on-surface rounded-full animate-spin" />
                      ) : saveStatus === 'success' ? (
                        <>
                          <Check className="w-5 h-5" />
                          {t('applied', language)}
                        </>
                      ) : (
                        t('applyChanges', language)
                      )}
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'storage' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-xl font-bold text-on-surface mb-6">Estado del Almacenamiento</h3>
              <StorageManager />
            </motion.div>
          )}

          {activeTab === 'shortcuts' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-xl font-bold text-on-surface mb-6">{t('keyboardShortcuts', language)}</h3>
              
              <div className="glass-card rounded-xl overflow-hidden">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center justify-between px-6 py-4",
                      index !== shortcuts.length - 1 && "border-b border-on-surface/5"
                    )}
                  >
                    <span className="text-on-surface">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <span key={i}>
                          <kbd className="px-2 py-1 rounded-md bg-on-surface/10 text-xs font-mono text-on-surface-variant border border-on-surface/10">
                            {key}
                          </kbd>
                          {i < shortcut.keys.length - 1 && (
                            <span className="mx-1 text-on-surface-variant/40">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsView;
