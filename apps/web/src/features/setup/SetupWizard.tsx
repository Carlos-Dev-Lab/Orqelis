import { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Server, CheckCircle2, AlertTriangle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '@/shared/store';
import { api } from '@/shared/api';
import { cn } from '@/shared/utils';

export function SetupWizard() {
  const { checkSetup, setCurrentView, systemStatus } = useAppStore();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [setupPhase, setSetupPhase] = useState<'idle' | 'configuring' | 'verifying' | 'finalizing'>('idle');
  const [error, setError] = useState<string | null>(null);

  // SQLite is the only supported engine — dbConfig is hardcoded
  const dbConfig = { type: 'sqlite' as const, filename: 'dev.db' };

  const [setupToken, setSetupToken] = useState('');
  const [showSetupToken, setShowSetupToken] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [adminConfig, setAdminConfig] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleAdminConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAdminConfig(prev => ({ ...prev, [name]: value }));
    // Clear field-specific error when user types
    if (formErrors[name]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    
    if (!adminConfig.username) {
      errors.username = "Username is required";
    } else if (adminConfig.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(adminConfig.username)) {
      errors.username = "Username can only contain letters, numbers and underscores";
    }

    if (!adminConfig.email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminConfig.email)) {
      errors.email = "Invalid email format";
    }

    if (!adminConfig.password) {
      errors.password = "Password is required";
    } else {
      if (adminConfig.password.length < 12) errors.password = "Min 12 characters";
      else if (!/[A-Z]/.test(adminConfig.password)) errors.password = "Missing uppercase letter";
      else if (!/[a-z]/.test(adminConfig.password)) errors.password = "Missing lowercase letter";
      else if (!/[0-9]/.test(adminConfig.password)) errors.password = "Missing number";
      else if (!/[^A-Za-z0-9]/.test(adminConfig.password)) errors.password = "Missing special character";
    }

    if (adminConfig.password !== adminConfig.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSetup = async () => {
    if (isLoading) return; // Prevent double submission
    setError(null);
    if (!validate()) return;

    setIsLoading(true);
    setSetupPhase('configuring');
    
    try {
      try {
        await api.setup.configure({
          dbConfig,
          adminConfig: {
            username: adminConfig.username,
            email: adminConfig.email,
            password: adminConfig.password,
          }
        }, setupToken);
      } catch (err: any) {
        // If it's already configured, we treat it as success and move to verification
        if (err.message?.includes('ALREADY_CONFIGURED')) {
          console.log('System already configured, proceeding to verification...');
        } else {
          throw err;
        }
      }
      
      setSetupPhase('verifying');
      
      // Verification phase with retries and delay
      let isConfigured = false;
      let attempts = 0;
      const maxAttempts = 5;

      while (!isConfigured && attempts < maxAttempts) {
        attempts++;
        console.log(`Verification attempt ${attempts}...`);
        
        // Wait before checking (increasing delay)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        
        const status = await api.setup.getStatus(true); // Force refresh
        if (status.configured) {
          isConfigured = true;
          break;
        }
      }

      if (!isConfigured) {
        throw new Error("Configuration seemed successful but system status is still 'unconfigured' after several checks. Please check server logs and try refreshing the page.");
      }

      setSetupPhase('finalizing');
      await new Promise(resolve => setTimeout(resolve, 500)); // Smooth transition
      
      setStep(2);
    } catch (err: any) {
      console.error('Setup Error:', err);
      setError(err.response?.data?.error || err.message || 'Configuration failed');
    } finally {
      setIsLoading(false);
      setSetupPhase('idle');
    }
  };

  const renderStep = () => {
    if (systemStatus && systemStatus.database === 'error' && step === 1) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-on-surface mb-2">Database Error</h3>
          <p className="text-on-surface-variant mb-8 leading-relaxed">
            Cannot connect to the database. Setup cannot continue until the database is reachable.
            <br />
            <span className="text-xs font-mono mt-2 block opacity-70">{systemStatus.details}</span>
          </p>
          <button
            onClick={() => checkSetup()}
            className="bg-primary hover:bg-primary/90 text-background font-bold px-8 py-3 rounded-xl transition-all flex items-center gap-2 mx-auto"
          >
            <Server className="w-4 h-4" />
            Retry Connection
          </button>
        </motion.div>
      );
    }

    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-on-surface">Initial Admin User</h3>
                <p className="text-sm text-on-surface-variant">Create the master account</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Setup Token (Required in production)</label>
                <div className="relative">
                  <input
                    type={showSetupToken ? "text" : "password"}
                    value={setupToken}
                    onChange={(e) => setSetupToken(e.target.value)}
                    placeholder="Enter SETUP_TOKEN from environment"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-12 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSetupToken(!showSetupToken)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    {showSetupToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Username</label>
                <input
                  type="text"
                  name="username"
                  value={adminConfig.username}
                  onChange={handleAdminConfigChange}
                  className={cn(
                    "w-full bg-white/5 border rounded-xl px-4 py-2.5 text-on-surface focus:outline-none focus:ring-2 transition-all",
                    formErrors.username ? "border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:ring-primary/50"
                  )}
                  placeholder="admin"
                />
                {formErrors.username && <p className="text-[10px] text-red-400 mt-1 ml-1">{formErrors.username}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={adminConfig.email}
                  onChange={handleAdminConfigChange}
                  className={cn(
                    "w-full bg-white/5 border rounded-xl px-4 py-2.5 text-on-surface focus:outline-none focus:ring-2 transition-all",
                    formErrors.email ? "border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:ring-primary/50"
                  )}
                  placeholder="admin@orqelis.io"
                />
                {formErrors.email && <p className="text-[10px] text-red-400 mt-1 ml-1">{formErrors.email}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showAdminPassword ? "text" : "password"}
                      name="password"
                      value={adminConfig.password}
                      onChange={handleAdminConfigChange}
                      className={cn(
                        "w-full bg-white/5 border rounded-xl px-4 py-2.5 pr-12 text-on-surface focus:outline-none focus:ring-2 transition-all",
                        formErrors.password ? "border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:ring-primary/50"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formErrors.password && <p className="text-[10px] text-red-400 mt-1 ml-1">{formErrors.password}</p>}
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={adminConfig.confirmPassword}
                      onChange={handleAdminConfigChange}
                      className={cn(
                        "w-full bg-white/5 border rounded-xl px-4 py-2.5 pr-12 text-on-surface focus:outline-none focus:ring-2 transition-all",
                        formErrors.confirmPassword ? "border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:ring-primary/50"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formErrors.confirmPassword && <p className="text-[10px] text-red-400 mt-1 ml-1">{formErrors.confirmPassword}</p>}
                </div>
              </div>
            </div>

              <button
                onClick={handleSetup}
                disabled={isLoading}
                className="flex-1 bg-primary hover:bg-primary/90 text-background font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {setupPhase === 'configuring' && 'Configuring System...'}
                    {setupPhase === 'verifying' && 'Verifying Status...'}
                    {setupPhase === 'finalizing' && 'Finalizing...'}
                    {setupPhase === 'idle' && 'Initializing...'}
                  </>
                ) : (
                  <>
                    Complete Setup
                    <CheckCircle2 className="w-5 h-5" />
                  </>
                )}
              </button>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-on-surface mb-2">Setup Complete!</h3>
            <p className="text-on-surface-variant mb-8 leading-relaxed">
              Orqelis has been successfully configured with your {dbConfig.type} database. 
              You can now log in with the admin account you just created.
            </p>
            <button
              onClick={async () => {
                if (isLoading) return;
                setIsLoading(true);
                setSetupPhase('verifying');
                try {
                  await checkSetup(true); // Force refresh
                  const { needsSetup } = useAppStore.getState();
                  if (!needsSetup) {
                    setCurrentView('login');
                  } else {
                    setError("System still reports it needs setup. Please try again or check logs.");
                    setStep(1);
                  }
                } catch (err) {
                  setError("Failed to verify system status.");
                } finally {
                  setIsLoading(false);
                  setSetupPhase('idle');
                }
              }}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-background font-bold px-8 py-3 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 mx-auto"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Verifying...' : 'Go to Login'}
            </button>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 aurora-bg opacity-30" />
      <div className="absolute inset-0 noise-overlay" />
      
      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <Server className="w-8 h-8 text-background" />
          </div>
          <h2 className="text-3xl font-bold text-on-surface mb-2">Welcome to Orqelis</h2>
          <p className="text-on-surface-variant">System Configuration Wizard</p>
        </div>

        <div className="glass-card rounded-3xl p-8 border border-white/10 relative overflow-hidden">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/5">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: '0%' }}
              animate={{ width: `${(step / 2) * 100}%` }}
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3"
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          {renderStep()}
        </div>

        <p className="text-center text-[10px] text-on-surface-variant mt-8 uppercase tracking-widest opacity-50">
          Orqelis Deployment v1.0.0 • Initial Configuration Required
        </p>
      </div>
    </div>
  );
}
