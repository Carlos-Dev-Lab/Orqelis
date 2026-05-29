import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';
import { useAppStore } from '@/shared/store';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/utils';

export function AlertDialog() {
  const { alertDialog, hideAlert, language } = useAppStore();
  const { show, title, message, type, confirmLabel, cancelLabel, onConfirm, onCancel } = alertDialog;

  if (!show && !alertDialog.show) return null;

  const getIcon = () => {
    switch (type) {
      case 'confirm':
        return <HelpCircle className="w-8 h-8 text-primary" />;
      case 'alert':
      default:
        return <AlertTriangle className="w-8 h-8 text-warning" />;
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={hideAlert}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm glass-card rounded-2xl border border-on-surface/10 p-6 shadow-2xl overflow-hidden"
          >
            <button 
              onClick={hideAlert}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-on-surface/5 flex items-center justify-center mb-6">
                {getIcon()}
              </div>
              
              <h2 className="text-xl font-bold text-on-surface mb-2">
                {title}
              </h2>
              <p className="text-on-surface-variant mb-8 text-sm leading-relaxed">
                {message}
              </p>

              <div className="flex gap-3 w-full">
                {type === 'confirm' && (
                  <button
                    onClick={() => {
                      if (onCancel) onCancel();
                      else hideAlert();
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-on-surface/5 text-on-surface font-medium hover:bg-on-surface/10 transition-colors border border-on-surface/10"
                  >
                    {cancelLabel || t('cancel', language)}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (onConfirm) onConfirm();
                    else hideAlert();
                  }}
                  className={cn(
                    "flex-1 px-4 py-2.5 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]",
                    type === 'confirm' ? "bg-primary text-on-primary" : "bg-warning/20 text-warning border border-warning/20 hover:bg-warning/30"
                  )}
                >
                  {confirmLabel || (type === 'confirm' ? t('confirm', language) : t('ok', language))}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
