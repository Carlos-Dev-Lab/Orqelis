import { useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  Boxes,
  Code2,
  FileText,
  KeyRound,
  Languages,
  Lock,
  Moon,
  PenTool,
  Search,
  Server,
  Share2,
  ShieldCheck,
  Sparkles,
  Sun,
  Terminal,
} from 'lucide-react';
import { useAppStore } from '@/shared/store';
import { cn } from '@/shared/utils';
import type { Language } from '@/shared/i18n';

// Landing copy lives here (like MarkdownAssistant) to keep the global dictionary focused on the app
const text = {
  en: {
    nav: { features: 'Features', how: 'How it works', security: 'Security' },
    signIn: 'Sign in',
    goToDashboard: 'Go to dashboard',
    badge: 'Technical knowledge platform',
    titleStart: 'Your technical knowledge,',
    titleHighlight: 'connected.',
    subtitle: 'Notes, hand-drawn diagrams, code snippets and a knowledge graph in one self-hosted workspace built for developers.',
    explore: 'Explore features',
    pills: ['Self-hosted with Docker', 'Markdown + Mermaid', 'Excalidraw diagrams', 'Keyboard first'],
    featuresEyebrow: 'Everything in one place',
    featuresTitle: 'Built for the way developers document',
    featuresSubtitle: 'Write, draw and link your knowledge. Orqelis keeps every idea one [[link]] away.',
    features: {
      notes: { title: 'Smart technical notes', desc: 'Markdown with syntax highlighting, Mermaid diagrams, templates and a style guide inside the editor.' },
      diagrams: { title: 'Hand-drawn diagrams', desc: 'Sketch architectures with Excalidraw, link them to notes, preview them on hover and embed them with ![[title]].' },
      graph: { title: 'Knowledge graph', desc: 'Every [[link]] becomes an edge. Spot clusters, dependencies and orphan notes at a glance.' },
      console: { title: 'Developer console', desc: 'Create, search, inspect and link from a command line with autocomplete.' },
      snippets: { title: 'Snippet library', desc: 'Reusable code blocks with tags, languages and usage tracking, linked to your notes.' },
      search: { title: 'Search & shortcuts', desc: 'Find anything with Ctrl+K and create notes or diagrams without leaving the keyboard.' },
    },
    searchPlaceholder: 'Search notes, diagrams…',
    howEyebrow: 'How it works',
    howTitle: 'From a quick note to a living map',
    steps: [
      { title: 'Write or draw', desc: 'Start a markdown note (Ctrl+Alt+N) or a diagram (Ctrl+Alt+D). Everything saves automatically.' },
      { title: 'Connect with [[links]]', desc: 'Reference other notes and diagrams by title. Backlinks and previews appear on their own.' },
      { title: 'See the big picture', desc: 'Explore the knowledge graph, group by workspace and find what is still disconnected.' },
    ],
    securityEyebrow: 'Your data, your server',
    securityTitle: 'Private by design',
    security: [
      { title: 'Self-hosted', desc: 'Run it with Docker Compose on your own infrastructure.' },
      { title: 'Secure sessions', desc: 'JWT with refresh-token rotation and Argon2 password hashing.' },
      { title: 'Files on your disk', desc: 'Diagram images are stored as files on your server, not in third-party clouds.' },
      { title: 'Roles & audit log', desc: 'Admin panel, user roles and an audit trail of critical actions.' },
    ],
    ctaTitle: 'Ready to organise your technical knowledge?',
    ctaSubtitle: 'Sign in to your workspace and start connecting notes, diagrams and code.',
    footerTagline: 'Technical knowledge, connected.',
    license: 'Open source · MIT license',
    mock: {
      note: 'Authentication architecture',
      tags: ['backend', 'security'],
      line1: 'Tokens are signed by the',
      link: 'Token service',
      line2: 'and rotated on every refresh.',
      preview: 'Token service',
      graph: 'Knowledge graph',
      console: 'Console',
    },
  },
  es: {
    nav: { features: 'Funcionalidades', how: 'Cómo funciona', security: 'Seguridad' },
    signIn: 'Iniciar sesión',
    goToDashboard: 'Ir al panel',
    badge: 'Plataforma de conocimiento técnico',
    titleStart: 'Tu conocimiento técnico,',
    titleHighlight: 'conectado.',
    subtitle: 'Notas, diagramas a mano alzada, fragmentos de código y un grafo de conocimiento en un espacio autoalojado pensado para desarrolladores.',
    explore: 'Ver funcionalidades',
    pills: ['Autoalojado con Docker', 'Markdown + Mermaid', 'Diagramas Excalidraw', 'Pensado para teclado'],
    featuresEyebrow: 'Todo en un solo lugar',
    featuresTitle: 'Hecho para la forma en que documentan los desarrolladores',
    featuresSubtitle: 'Escribe, dibuja y conecta tu conocimiento. En Orqelis cada idea está a un [[vínculo]] de distancia.',
    features: {
      notes: { title: 'Notas técnicas inteligentes', desc: 'Markdown con resaltado de sintaxis, diagramas Mermaid, plantillas y guía de estilos dentro del editor.' },
      diagrams: { title: 'Diagramas a mano alzada', desc: 'Dibuja arquitecturas con Excalidraw, vincúlalas a tus notas, previsualízalas al pasar el ratón e incrústalas con ![[título]].' },
      graph: { title: 'Grafo de conocimiento', desc: 'Cada [[vínculo]] se convierte en una conexión. Detecta grupos, dependencias y notas huérfanas de un vistazo.' },
      console: { title: 'Consola de desarrollador', desc: 'Crea, busca, inspecciona y vincula desde una línea de comandos con autocompletado.' },
      snippets: { title: 'Biblioteca de fragmentos', desc: 'Bloques de código reutilizables con etiquetas, lenguajes y contador de uso, enlazados a tus notas.' },
      search: { title: 'Búsqueda y atajos', desc: 'Encuentra cualquier cosa con Ctrl+K y crea notas o diagramas sin soltar el teclado.' },
    },
    searchPlaceholder: 'Buscar notas, diagramas…',
    howEyebrow: 'Cómo funciona',
    howTitle: 'De una nota rápida a un mapa vivo',
    steps: [
      { title: 'Escribe o dibuja', desc: 'Empieza una nota markdown (Ctrl+Alt+N) o un diagrama (Ctrl+Alt+D). Todo se guarda automáticamente.' },
      { title: 'Conecta con [[vínculos]]', desc: 'Referencia otras notas y diagramas por su título. Las referencias y vistas previas aparecen solas.' },
      { title: 'Mira el panorama', desc: 'Explora el grafo de conocimiento, agrupa por espacios de trabajo y encuentra lo que aún está desconectado.' },
    ],
    securityEyebrow: 'Tus datos, tu servidor',
    securityTitle: 'Privado por diseño',
    security: [
      { title: 'Autoalojado', desc: 'Despliégalo con Docker Compose en tu propia infraestructura.' },
      { title: 'Sesiones seguras', desc: 'JWT con rotación de tokens de refresco y contraseñas cifradas con Argon2.' },
      { title: 'Archivos en tu disco', desc: 'Las imágenes de los diagramas se guardan como archivos en tu servidor, no en nubes de terceros.' },
      { title: 'Roles y auditoría', desc: 'Panel de administración, roles de usuario y registro de acciones críticas.' },
    ],
    ctaTitle: '¿Listo para ordenar tu conocimiento técnico?',
    ctaSubtitle: 'Inicia sesión en tu espacio de trabajo y empieza a conectar notas, diagramas y código.',
    footerTagline: 'Conocimiento técnico, conectado.',
    license: 'Código abierto · Licencia MIT',
    mock: {
      note: 'Arquitectura de autenticación',
      tags: ['backend', 'seguridad'],
      line1: 'Los tokens los firma el',
      link: 'Servicio de tokens',
      line2: 'y rotan en cada refresco.',
      preview: 'Servicio de tokens',
      graph: 'Grafo de conocimiento',
      console: 'Consola',
    },
  },
} as const;

type Copy = (typeof text)[Language];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

function Logo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className={cn(
          'flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-background shadow-lg shadow-primary/20',
          size === 'md' ? 'h-9 w-9' : 'h-8 w-8'
        )}
      >
        <Share2 className={size === 'md' ? 'h-[18px] w-[18px]' : 'h-4 w-4'} />
      </span>
      <span className="text-lg font-bold tracking-tight text-on-surface">Orqelis</span>
    </span>
  );
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h2 className="text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-4 text-base leading-relaxed text-on-surface-variant sm:text-lg">{subtitle}</p>}
    </div>
  );
}

/** Hand-drawn looking diagram used in the mock-ups (pure SVG, no Excalidraw bundle). */
function SketchDiagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 120" className={className} fill="none" aria-hidden="true">
      <path d="M12 16c20-2 44-1 62 1 2 10 1 22-1 32-20 2-42 1-61-1-2-10-2-22 0-32Z" className="fill-primary/15 stroke-primary" strokeWidth="2" strokeLinejoin="round" />
      <path d="M146 14c20-1 44 0 62 2 1 10 1 22-1 32-19 2-43 2-61 0-2-10-2-24 0-34Z" className="fill-secondary/15 stroke-secondary" strokeWidth="2" strokeLinejoin="round" />
      <path d="M150 80c18-4 42-3 58 1 3 8 2 20-1 28-17 3-40 3-57-1-3-9-3-19 0-28Z" className="fill-tertiary/15 stroke-tertiary" strokeWidth="2" strokeLinejoin="round" />
      <path d="M77 33c22 1 42-1 64-1" className="stroke-on-surface-variant" strokeWidth="2" strokeLinecap="round" />
      <path d="m133 26 9 6-9 7" className="stroke-on-surface-variant" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M178 52c1 8-1 16 0 24" className="stroke-on-surface-variant" strokeWidth="2" strokeLinecap="round" />
      <path d="m171 69 7 9 7-9" className="stroke-on-surface-variant" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="28" y="28" width="30" height="5" rx="2.5" className="fill-primary/60" />
      <rect x="161" y="27" width="32" height="5" rx="2.5" className="fill-secondary/60" />
      <rect x="164" y="93" width="30" height="5" rx="2.5" className="fill-tertiary/60" />
    </svg>
  );
}

function MiniGraph({ className }: { className?: string }) {
  const nodes = [
    [40, 40, 'fill-primary'], [110, 22, 'fill-secondary'], [175, 55, 'fill-tertiary'],
    [95, 90, 'fill-primary'], [30, 105, 'fill-secondary'], [165, 112, 'fill-primary'],
  ] as const;
  const edges = [[0, 1], [1, 2], [0, 3], [3, 2], [3, 4], [3, 5], [2, 5]];
  return (
    <svg viewBox="0 0 210 135" className={className} aria-hidden="true">
      {edges.map(([a, b]) => (
        <line key={`${a}-${b}`} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} className="stroke-on-surface/20" strokeWidth="1.5" />
      ))}
      {nodes.map(([x, y, color], index) => (
        <g key={index}>
          <circle cx={x} cy={y} r={index === 3 ? 11 : 8} className={cn(color, 'opacity-25')} />
          <circle cx={x} cy={y} r={index === 3 ? 6 : 4.5} className={color} />
        </g>
      ))}
    </svg>
  );
}

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="rounded-md border border-on-surface/10 bg-on-surface/5 px-1.5 py-0.5 font-mono text-[11px] text-on-surface-variant">
      {children}
    </kbd>
  );
}

function ProductPreview({ copy }: { copy: Copy }) {
  const reduceMotion = useReducedMotion();
  const float = (delay: number) =>
    reduceMotion ? {} : { animate: { y: [0, -8, 0] }, transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' as const, delay } };

  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-secondary/10 to-tertiary/20 blur-3xl" aria-hidden="true" />

      {/* App window */}
      <div className="relative overflow-hidden rounded-2xl border border-on-surface/10 bg-surface-container-lowest/90 shadow-2xl shadow-black/20">
        <div className="flex items-center gap-2 border-b border-on-surface/5 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-error/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
          <span className="ml-3 hidden flex-1 rounded-md bg-on-surface/5 px-3 py-1 font-mono text-[11px] text-on-surface-variant sm:block">orqelis.local/notes</span>
        </div>
        <div className="flex">
          <div className="hidden w-12 shrink-0 flex-col items-center gap-3 border-r border-on-surface/5 py-4 sm:flex">
            {[FileText, PenTool, Share2, Code2, Terminal].map((Icon, index) => (
              <span key={index} className={cn('flex h-8 w-8 items-center justify-center rounded-lg', index === 0 ? 'bg-primary/15 text-primary' : 'text-on-surface-variant/60')}>
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
          <div className="min-w-0 flex-1 p-5 sm:p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {copy.mock.tags.map((tag) => (
                <span key={tag} className="rounded-md border border-on-surface/10 bg-on-surface/5 px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">#{tag}</span>
              ))}
            </div>
            <h3 className="mb-4 text-xl font-bold text-on-surface sm:text-2xl">{copy.mock.note}</h3>
            <div className="space-y-2.5 text-sm leading-relaxed text-on-surface-variant">
              <p>
                {copy.mock.line1}{' '}
                <span className="inline-flex items-center gap-1 rounded-md bg-secondary/10 px-1.5 py-0.5 font-semibold text-secondary">
                  <PenTool className="h-3 w-3" />
                  {copy.mock.link}
                </span>{' '}
                {copy.mock.line2}
              </p>
              <div className="h-2 w-11/12 rounded-full bg-on-surface/10" />
              <div className="h-2 w-4/5 rounded-full bg-on-surface/10" />
              <div className="rounded-xl border border-on-surface/5 bg-on-surface/[0.03] p-3 font-mono text-xs">
                <span className="text-tertiary">const</span> <span className="text-on-surface">token</span> = <span className="text-primary">sign</span>(payload, <span className="text-success">'15m'</span>);
              </div>
              <div className="h-2 w-2/3 rounded-full bg-on-surface/10" />
              <div className="h-2 w-5/6 rounded-full bg-on-surface/10" />
              <div className="h-2 w-1/2 rounded-full bg-on-surface/10" />
            </div>
          </div>
        </div>
      </div>

      {/* Diagram preview card */}
      <motion.div
        {...float(0)}
        className="absolute -bottom-20 -left-3 w-44 rounded-2xl border border-on-surface/10 bg-surface-container p-3 shadow-2xl sm:-left-12 sm:w-56"
      >
        <SketchDiagram className="h-24 w-full" />
        <p className="mt-2 flex items-center gap-1.5 truncate text-xs font-semibold text-on-surface">
          <PenTool className="h-3.5 w-3.5 shrink-0 text-secondary" />
          {copy.mock.preview}
        </p>
      </motion.div>

      {/* Graph card */}
      <motion.div
        {...float(1.5)}
        className="absolute -right-4 -top-20 hidden w-44 rounded-2xl border border-on-surface/10 bg-surface-container p-3 shadow-2xl sm:block lg:-right-10"
      >
        <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
          <Share2 className="h-3.5 w-3.5 text-primary" />
          {copy.mock.graph}
        </p>
        <MiniGraph className="h-28 w-full" />
      </motion.div>

      {/* Console card */}
      <motion.div
        {...float(3)}
        className="absolute -bottom-24 -right-2 hidden w-52 rounded-2xl border border-on-surface/10 bg-surface-container-lowest p-3 font-mono text-[11px] shadow-2xl md:block lg:-right-12"
      >
        <p className="mb-1.5 flex items-center gap-1.5 font-sans text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
          <Terminal className="h-3.5 w-3.5 text-tertiary" />
          {copy.mock.console}
        </p>
        <p className="text-primary">$ new-diagram Auth</p>
        <p className="text-success">✓ Auth</p>
        <p className="text-primary">$ links "Auth"</p>
        <p className="text-on-surface-variant">→ Token service</p>
      </motion.div>
    </div>
  );
}

export function Landing() {
  const { setCurrentView, language, setLanguage, theme, setTheme, isAuthenticated } = useAppStore();
  const copy = text[language] ?? text.en;
  const featuresRef = useRef<HTMLElement>(null);
  const howRef = useRef<HTMLElement>(null);
  const securityRef = useRef<HTMLElement>(null);

  const primaryAction = () => setCurrentView(isAuthenticated ? 'dashboard' : 'login');
  const primaryLabel = isAuthenticated ? copy.goToDashboard : copy.signIn;
  const scrollTo = (ref: React.RefObject<HTMLElement | null>) => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const featureCards = [
    {
      key: 'diagrams', icon: PenTool, accent: 'text-secondary bg-secondary/10', className: 'md:col-span-2 lg:row-span-2',
      visual: (
        <div className="mt-6 overflow-hidden rounded-xl border border-on-surface/5 bg-surface-container-lowest/80 p-4 sm:p-6">
          <SketchDiagram className="mx-auto h-44 w-full max-w-lg lg:h-64" />
          <p className="mt-3 text-center font-mono text-xs text-on-surface-variant">![[{copy.mock.preview}]]</p>
        </div>
      ),
    },
    {
      key: 'notes', icon: FileText, accent: 'text-primary bg-primary/10', className: '',
      visual: (
        <div className="mt-5 space-y-2 rounded-xl border border-on-surface/5 bg-surface-container-lowest/80 p-3 font-mono text-xs text-on-surface-variant">
          <p><span className="text-primary">##</span> API</p>
          <p><span className="text-tertiary">```mermaid</span></p>
          <p>flowchart LR A --&gt; B</p>
        </div>
      ),
    },
    {
      key: 'graph', icon: Share2, accent: 'text-primary bg-primary/10', className: '',
      visual: <MiniGraph className="mt-3 h-28 w-full" />,
    },
    {
      key: 'console', icon: Terminal, accent: 'text-tertiary bg-tertiary/10', className: '',
      visual: (
        <div className="mt-5 rounded-xl border border-on-surface/5 bg-surface-container-lowest/80 p-3 font-mono text-xs">
          <p className="text-primary">$ search auth</p>
          <p className="text-on-surface-variant">• [note/backend] Auth flow</p>
          <p className="text-on-surface-variant">• [diagram/docs] Tokens</p>
        </div>
      ),
    },
    {
      key: 'snippets', icon: Code2, accent: 'text-success bg-success/10', className: '',
      visual: (
        <div className="mt-5 rounded-xl border border-on-surface/5 bg-surface-container-lowest/80 p-3 font-mono text-xs">
          <p><span className="rounded bg-on-surface/10 px-1.5 py-0.5 text-[10px] text-on-surface-variant">typescript</span></p>
          <p className="mt-2"><span className="text-tertiary">export const</span> <span className="text-primary">retry</span> = …</p>
        </div>
      ),
    },
    {
      key: 'search', icon: Search, accent: 'text-warning bg-warning/10', className: 'md:col-span-2 lg:col-span-1',
      visual: (
        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-on-surface/10 bg-surface-container-lowest/80 px-3 py-2 text-xs text-on-surface-variant">
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1 truncate">{copy.searchPlaceholder}</span>
            <Kbd>Ctrl K</Kbd>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1"><Kbd>Ctrl Alt N</Kbd></span>
            <span className="flex items-center gap-1"><Kbd>Ctrl Alt D</Kbd></span>
          </div>
        </div>
      ),
    },
  ] as const;

  const securityIcons = [Server, KeyRound, Boxes, ShieldCheck];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-transparent text-on-surface">
      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-on-surface/5 bg-background/70 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Orqelis">
            <Logo />
          </button>
          <div className="hidden items-center gap-8 text-sm font-medium text-on-surface-variant md:flex">
            <button onClick={() => scrollTo(featuresRef)} className="transition-colors hover:text-on-surface">{copy.nav.features}</button>
            <button onClick={() => scrollTo(howRef)} className="transition-colors hover:text-on-surface">{copy.nav.how}</button>
            <button onClick={() => scrollTo(securityRef)} className="transition-colors hover:text-on-surface">{copy.nav.security}</button>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
              className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold uppercase text-on-surface-variant transition-colors hover:bg-on-surface/5 hover:text-on-surface"
              aria-label="Language"
            >
              <Languages className="h-4 w-4" />
              {language === 'es' ? 'EN' : 'ES'}
            </button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-on-surface/5 hover:text-on-surface"
              aria-label="Theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={primaryAction}
              className="ml-1 flex h-9 items-center gap-2 rounded-lg bg-on-surface px-3.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 sm:px-4"
            >
              <Lock className="h-4 w-4 sm:hidden" />
              <span className="hidden sm:inline">{primaryLabel}</span>
            </button>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
            <div
              className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,color-mix(in_srgb,var(--on-surface)_6%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--on-surface)_6%,transparent)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]"
            />
          </div>

          <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-4 pb-24 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:px-8 lg:pb-20 lg:pt-20">
            <motion.div initial="hidden" animate="visible" transition={{ staggerChildren: 0.08 }} className="text-center lg:text-left">
              <motion.p variants={fadeUp} className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary sm:text-sm">
                <Sparkles className="h-4 w-4" />
                {copy.badge}
              </motion.p>
              <motion.h1 variants={fadeUp} className="text-4xl font-bold leading-[1.08] tracking-tight text-on-surface sm:text-5xl xl:text-6xl">
                {copy.titleStart}{' '}
                <span className="text-gradient">{copy.titleHighlight}</span>
              </motion.h1>
              <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-on-surface-variant sm:text-lg lg:mx-0">
                {copy.subtitle}
              </motion.p>
              <motion.div variants={fadeUp} className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
                <button
                  onClick={primaryAction}
                  className="btn-glow flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-7 py-3.5 text-base font-bold text-background"
                >
                  {primaryLabel}
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => scrollTo(featuresRef)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-on-surface/10 bg-on-surface/5 px-7 py-3.5 text-base font-semibold text-on-surface transition-colors hover:bg-on-surface/10"
                >
                  {copy.explore}
                </button>
              </motion.div>
              <motion.ul variants={fadeUp} className="mt-9 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-on-surface-variant lg:justify-start">
                {copy.pills.map((pill) => (
                  <li key={pill} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {pill}
                  </li>
                ))}
              </motion.ul>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="px-4 pb-16 pt-12 sm:px-12 sm:pb-20 lg:px-6">
              <ProductPreview copy={copy} />
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section ref={featuresRef} className="scroll-mt-20 px-4 pb-20 pt-12 sm:px-6 sm:pb-28 sm:pt-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading eyebrow={copy.featuresEyebrow} title={copy.featuresTitle} subtitle={copy.featuresSubtitle} />
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featureCards.map(({ key, icon: Icon, accent, className, visual }, index) => {
                const feature = copy.features[key];
                return (
                  <motion.article
                    key={key}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className={cn('glass-card flex flex-col rounded-2xl p-6', className)}
                  >
                    <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl', accent)}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className={cn('mt-5 font-bold text-on-surface', key === 'diagrams' ? 'text-2xl' : 'text-lg')}>{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{feature.desc}</p>
                    <div className="mt-auto">{visual}</div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section ref={howRef} className="scroll-mt-20 border-y border-on-surface/5 bg-surface-container-lowest/40 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <SectionHeading eyebrow={copy.howEyebrow} title={copy.howTitle} />
            <ol className="grid gap-6 md:grid-cols-3">
              {copy.steps.map((step, index) => (
                <motion.li
                  key={step.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative rounded-2xl border border-on-surface/5 bg-surface-container/60 p-6"
                >
                  <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary font-mono text-sm font-bold text-background">
                    {index + 1}
                  </span>
                  <h3 className="text-lg font-bold text-on-surface">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{step.desc}</p>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>

        {/* Security */}
        <section ref={securityRef} className="scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <SectionHeading eyebrow={copy.securityEyebrow} title={copy.securityTitle} />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {copy.security.map((item, index) => {
                const Icon = securityIcons[index];
                return (
                  <div key={item.title} className="rounded-2xl border border-on-surface/5 p-6 transition-colors hover:border-primary/20">
                    <Icon className="h-6 w-6 text-primary" />
                    <h3 className="mt-4 font-bold text-on-surface">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 pb-24 sm:px-6 lg:px-8">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-surface-container to-secondary/15 px-6 py-14 text-center sm:px-12 sm:py-16">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
            <h2 className="relative text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">{copy.ctaTitle}</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-on-surface-variant sm:text-lg">{copy.ctaSubtitle}</p>
            <button
              onClick={primaryAction}
              className="btn-glow relative mx-auto mt-8 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-8 py-3.5 text-base font-bold text-background"
            >
              {primaryLabel}
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-on-surface/5 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
          <div className="flex flex-col items-center gap-2 md:flex-row md:gap-4">
            <Logo size="sm" />
            <span className="text-sm text-on-surface-variant">{copy.footerTagline}</span>
          </div>
          <p className="text-sm text-on-surface-variant">
            © {new Date().getFullYear()} Orqelis · {copy.license}
          </p>
        </div>
      </footer>
    </div>
  );
}
