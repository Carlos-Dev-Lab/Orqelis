import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Mail, Chrome, ArrowRight, ShieldCheck, AlertTriangle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '@/shared/store';
import { api, checkServerStatus, getDbStatus } from '@/shared/api';
import { t } from '@/shared/i18n';

export function Login() {
  const { login, language, isServerOnline, setServerOnline, checkSetup } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbConnected, setDbConnected] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      setIsChecking(true);
      const online = await checkServerStatus(true);
      setServerOnline(online);
      setDbConnected(getDbStatus());
      setIsChecking(false);
    };
    checkStatus();
  }, [setServerOnline]);

  const handleRetry = async () => {
    setIsChecking(true);
    const online = await checkServerStatus(true);
    setServerOnline(online);
    setDbConnected(getDbStatus());
    setIsChecking(false);
  };

  const handleGoogleLogin = async () => {
    if (!isServerOnline || !dbConnected) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.auth.loginWithGoogle('mock-google-token');
      login(data.accessToken, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isServerOnline || !dbConnected) return;
    setIsLoading(true);
    setError(null);

    if (password.length < 8) {
      setError(t('passwordTooShort', language));
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.auth.login(email, password);
      login(data.accessToken, data.user);
    } catch (err: any) {
      if (err.message.includes('401') || err.message.toLowerCase().includes('credentials')) {
        setError(t('invalidCredentials', language));
      } else if (err.message.includes('at least 8 characters')) {
        setError(t('passwordTooShort', language));
      } else {
        setError(err.message || t('loginError', language));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const showDbWarning = !isChecking && (!isServerOnline || !dbConnected);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 aurora-bg opacity-50" />
      <div className="absolute inset-0 noise-overlay" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-md p-8 rounded-3xl relative z-10 border border-white/10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <Lock className="w-8 h-8 text-background" />
          </div>
          <h2 className="text-3xl font-bold text-on-surface mb-2">{t('welcomeBack', language)}</h2>
          <p className="text-on-surface-variant">{t('secureAccess', language)}</p>
        </div>

        {isChecking && (
          <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm flex items-center justify-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin" />
            {t('checking', language)}
          </div>
        )}

        {showDbWarning && (
          <div className="mb-6 p-4 rounded-xl bg-warning/10 border border-warning/20 text-on-surface text-sm space-y-3">
            <div className="flex items-start gap-3 text-warning">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div className="font-bold">{t('dbNotConfigured', language)}</div>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {t('dbConfigRequired', language)}
            </p>
            <div className="flex flex-col gap-4 pt-1">
              <button 
                onClick={handleRetry}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                {t('connectionRetry', language)}
              </button>
              <button 
                onClick={() => checkSetup()}
                className="w-full py-2 px-4 bg-primary/20 text-primary text-xs font-bold rounded-lg hover:bg-primary/30 transition-all border border-primary/30"
              >
                {t('dbConfigLink', language)}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleManualLogin} className="space-y-4 mb-8">
          <div className="space-y-2">
            <label className="text-sm font-medium text-on-surface-variant ml-1">
              {t('emailAddress', language)}
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input
                type="email"
                value={email}
                disabled={showDbWarning || isLoading}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@orqelis.io"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-on-surface-variant ml-1">
              {t('password', language)}
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                disabled={showDbWarning || isLoading}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-12 text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || showDbWarning || isChecking}
            className="w-full py-4 bg-primary text-background font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 btn-glow"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
            ) : (
              <>
                {t('signIn', language)}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#0f172a] px-2 text-on-surface-variant">{t('orContinueWith', language)}</span>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading || showDbWarning || isChecking}
            className="flex items-center justify-center gap-3 py-3 px-8 rounded-xl border border-white/10 hover:bg-white/5 transition-all disabled:opacity-50"
          >
            <Chrome className="w-5 h-5" />
            <span className="text-sm font-medium">Google</span>
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-on-surface-variant">
          {t('noAccount', language)}
        </p>
      </motion.div>
    </div>
  );
}
