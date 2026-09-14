import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, Database, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '@/shared/store';
import { t } from '@/shared/i18n';
import { onServerStatusChange, checkServerStatus, getDbStatus } from '@/shared/api';
import { cn } from '@/shared/utils';

export function ConnectionStatusModal() {
  const { isServerOnline, setServerOnline, showConnectionModal, setShowConnectionModal, language } = useAppStore();
  const [isRetrying, setIsRetrying] = useState(false);
  const [dbConnected, setDbConnected] = useState(true);

  useEffect(() => {
    // Sync store with API internal state and subscribe to changes
    const unsubscribe = onServerStatusChange((online) => {
      setServerOnline(online);
      setDbConnected(getDbStatus());
    });

    // Initial check
    checkServerStatus().then(online => {
      setServerOnline(online);
      setDbConnected(getDbStatus());
    });

    // Periodic check if offline or db error
    const interval = setInterval(() => {
      if (!isServerOnline || !dbConnected) {
        checkServerStatus().then(online => {
          setServerOnline(online);
          setDbConnected(getDbStatus());
        });
      }
    }, 30000); // Check every 30 seconds if offline

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [isServerOnline, setServerOnline, dbConnected]);

  useEffect(() => {
    // Only show automatically if there's a problem
    if (!isServerOnline || !dbConnected) {
      setShowConnectionModal(true);
    } else if (isServerOnline && dbConnected) {
      setShowConnectionModal(false);
    }
  }, [isServerOnline, dbConnected, setShowConnectionModal]);

  const handleRetry = async () => {
    setIsRetrying(true);
    const online = await checkServerStatus(true);
    setServerOnline(online);
    setDbConnected(getDbStatus());
    setIsRetrying(false);
  };

  return (
    <AnimatePresence>
      {showConnectionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConnectionModal(false)}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md glass-card rounded-2xl border border-primary/20 p-6 shadow-2xl shadow-primary/10 overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/20">
              {isRetrying && <motion.div 
                className="h-full bg-primary"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              />}
            </div>

            <button 
              onClick={() => setShowConnectionModal(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                {!isServerOnline ? <WifiOff className="w-8 h-8 text-primary" /> : <Database className="w-8 h-8 text-primary" />}
              </div>
              
              <h2 className="text-2xl font-bold text-on-surface mb-2">
                {!isServerOnline ? t('connectionError', language) : t('dbNotConfigured', language)}
              </h2>
              <p className="text-on-surface-variant mb-6 text-sm">
                {!isServerOnline ? t('connectionErrorDesc', language) : t('dbConfigRequired', language)}
              </p>

              <div className="w-full space-y-3 mb-8">
                <div className="bg-on-surface/5 rounded-xl p-4 border border-on-surface/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <WifiOff className={cn("w-5 h-5", isServerOnline ? "text-success" : "text-error")} />
                    <span className="text-sm font-medium">{t('serverStatus', language)}</span>
                  </div>
                  <span className={cn("text-xs font-bold px-2 py-1 rounded-md", isServerOnline ? "bg-success/20 text-success" : "bg-error/20 text-error")}>
                    {isServerOnline ? t('connected', language) : t('disconnected', language)}
                  </span>
                </div>

                <div className="bg-on-surface/5 rounded-xl p-4 border border-on-surface/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className={cn("w-5 h-5", dbConnected ? "text-success" : "text-warning")} />
                    <span className="text-sm font-medium">{t('dbStatus', language)}</span>
                  </div>
                  <span className={cn("text-xs font-bold px-2 py-1 rounded-md", dbConnected ? "bg-success/20 text-success" : "bg-warning/20 text-warning")}>
                    {dbConnected ? t('connected', language) : t('disconnected', language)}
                  </span>
                </div>

              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary font-bold transition-all",
                    isRetrying ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02] active:scale-[0.98]"
                  )}
                >
                  <RefreshCw className={cn("w-5 h-5", isRetrying && "animate-spin")} />
                  {t('connectionRetry', language)}
                </button>
                {!isServerOnline ? (
                  <button
                    onClick={() => setShowConnectionModal(false)}
                    className="px-6 py-3 rounded-xl bg-on-surface/5 text-on-surface-variant font-medium hover:bg-on-surface/10 transition-colors"
                  >
                    {t('close', language)}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowConnectionModal(false);
                      useAppStore.getState().checkSetup();
                    }}
                    className="px-6 py-3 rounded-xl bg-on-surface/5 text-on-surface font-medium hover:bg-on-surface/10 transition-colors border border-on-surface/10"
                  >
                    {t('dbConfigLink', language)}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
