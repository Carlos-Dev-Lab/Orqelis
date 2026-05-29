import { motion } from 'motion/react';
import { 
  FileText, 
  Share2, 
  Terminal, 
  Code2, 
  Database, 
  Search,
  ArrowRight,
  Sparkles,
  Lock
} from 'lucide-react';
import { useAppStore } from '@/shared/store';
import { t } from '@/shared/i18n';

export function Landing() {
  const { setCurrentView, language, isAuthenticated } = useAppStore();

  const features = [
    {
      icon: FileText,
      title: t('smartNotes', language),
      description: t('smartNotesDesc', language),
      view: 'editor',
      color: 'from-cyan-500/20 to-cyan-500/5',
      iconColor: 'text-cyan-400',
    },
    {
      icon: Share2,
      title: t('knowledgeGraph', language),
      description: t('knowledgeGraphDesc', language),
      view: 'graph',
      color: 'from-blue-500/20 to-blue-500/5',
      iconColor: 'text-blue-400',
    },
    {
      icon: Terminal,
      title: t('devConsole', language),
      description: t('devConsoleDesc', language),
      view: 'console',
      color: 'from-purple-500/20 to-purple-500/5',
      iconColor: 'text-purple-400',
    },
    {
      icon: Code2,
      title: t('snippetLibrary', language),
      description: t('snippetLibraryDesc', language),
      view: 'snippets',
      color: 'from-emerald-500/20 to-emerald-500/5',
      iconColor: 'text-emerald-400',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center relative">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-[100px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t('technicalPlatform', language)}</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
          >
            <span className="text-gradient">Orqelis</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            {t('heroSubtitle', language)}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {isAuthenticated ? (
              <button
                onClick={() => setCurrentView('dashboard')}
                className="btn-glow px-8 py-4 bg-gradient-to-r from-primary to-secondary text-background font-bold rounded-xl flex items-center gap-3 text-lg"
              >
                <ArrowRight className="w-5 h-5" />
                {t('goToDashboard', language)}
              </button>
            ) : (
              <button
                onClick={() => setCurrentView('login')}
                className="btn-glow px-8 py-4 bg-gradient-to-r from-primary to-secondary text-background font-bold rounded-xl flex items-center gap-3 text-lg"
              >
                <Lock className="w-5 h-5" />
                {t('signIn', language)}
              </button>
            )}
          </motion.div>
        </motion.div>

        {/* Floating Elements */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="absolute bottom-10 left-10 hidden lg:block"
        >
          <div className="glass-card rounded-xl p-4 w-64">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Database className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-on-surface">{t('localFirst', language)}</p>
                <p className="text-[10px] text-on-surface-variant">{t('worksOffline', language)}</p>
              </div>
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="absolute top-20 right-10 hidden lg:block"
        >
          <div className="glass-card rounded-xl p-4 w-56">
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-4 h-4 text-on-surface-variant" />
              <span className="text-sm text-on-surface-variant">{t('quickSearch', language)}</span>
            </div>
            <div className="font-mono text-xs text-primary bg-white/5 rounded px-2 py-1">
              {t('authSystemFound', language)}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="glass-card rounded-2xl p-6 group cursor-pointer"
                onClick={() => {
                  setCurrentView(isAuthenticated ? feature.view as any : 'login');
                }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                </div>
                <h3 className="text-lg font-bold text-on-surface mb-2">{feature.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Share2 className="text-background w-4 h-4" />
            </div>
            <span className="font-bold text-on-surface">Orqelis</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-on-surface-variant">
            <button className="hover:text-primary transition-colors">{t('documentation', language)}</button>
            <button className="hover:text-primary transition-colors">{t('changelog', language)}</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
