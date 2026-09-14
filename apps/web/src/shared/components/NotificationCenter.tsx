import { useRef, useEffect } from 'react';
import { Bell, Check, Trash2, X, Info, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/shared/store';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/utils';

export function NotificationCenter({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    deleteNotification, 
    clearNotifications,
    activeWorkspaceId,
    language
  } = useAppStore();
  
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredNotifications = notifications.filter(n => !n.workspaceId || n.workspaceId === activeWorkspaceId);
  const unreadCount = filteredNotifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-error" />;
      default: return <Info className="w-4 h-4 text-primary" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}${language === 'en' ? 'd ago' : 'd'}`;
    if (hours > 0) return `${hours}${language === 'en' ? 'h ago' : 'h'}`;
    if (minutes > 0) return `${minutes}${language === 'en' ? 'm ago' : 'min'}`;
    return language === 'en' ? 'Just now' : 'Ahora';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pointer-events-none">
      <div 
        ref={containerRef}
        className="w-full max-w-sm bg-surface-container-lowest border border-on-surface/10 rounded-2xl shadow-2xl pointer-events-auto flex flex-col max-h-[80vh] mt-14 animate-in fade-in slide-in-from-top-4 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-on-surface/5">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-on-surface">{t('navigation', language).replace('Navegación', 'Notificaciones').replace('Navigation', 'Notifications')}</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-primary text-on-primary rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button 
                onClick={markAllNotificationsAsRead}
                className="p-1.5 rounded-lg hover:bg-on-surface/5 text-on-surface-variant transition-colors"
                title={t('applied', language)}
              >
                <Check className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={clearNotifications}
              className="p-1.5 rounded-lg hover:bg-on-surface/5 text-on-surface-variant transition-colors"
              title={t('consoleCleared', language)}
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-on-surface/5 text-on-surface-variant transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-on-surface-variant/40 gap-3">
              <Bell className="w-12 h-12 stroke-[1]" />
              <p className="text-sm font-medium">{language === 'en' ? 'No notifications yet' : 'Sin notificaciones aún'}</p>
              <p className="text-xs text-center px-8">{language === 'en' ? 'When you have updates, they will appear here.' : 'Cuando tengas actualizaciones, aparecerán aquí.'}</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div 
                key={notification.id}
                className={cn(
                  "group relative p-3 rounded-xl transition-all border border-transparent hover:border-on-surface/5",
                  notification.read ? "opacity-60" : "bg-on-surface/5 border-on-surface/5"
                )}
              >
                <div className="flex gap-3">
                  <div className="mt-1 shrink-0">{getIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-sm font-medium text-on-surface leading-tight", !notification.read && "font-bold")}>
                        {notification.title}
                      </p>
                      <span className="text-[10px] text-on-surface-variant/60 whitespace-nowrap mt-0.5">
                        {formatTime(new Date(notification.timestamp))}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                    {!notification.read && (
                      <button 
                        onClick={() => markNotificationAsRead(notification.id)}
                        className="p-1.5 rounded-md hover:bg-on-surface/10 text-primary transition-colors"
                        title={t('applied', language)}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button 
                      onClick={() => deleteNotification(notification.id)}
                      className="p-1.5 rounded-md hover:bg-error/10 text-error transition-colors"
                      title={t('delete', language)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {filteredNotifications.length > 0 && (
          <div className="p-3 border-t border-on-surface/5 flex justify-center">
            <button 
              onClick={onClose}
              className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              {language === 'en' ? 'Dismiss All' : 'Descartar Todas'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
