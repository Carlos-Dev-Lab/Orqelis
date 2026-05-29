
export type Language = 'en' | 'es';

export const translations = {
  en: {
    // Sidebar
    dashboard: 'Dashboard',
    notes: 'Notes',
    graphView: 'Graph View',
    snippets: 'Snippets',
    devConsole: 'Dev Console',
    navigation: 'Navigation',
    groups: 'Groups',
    allNotes: 'All notes',
    favorites: 'Favorites',
    recent: 'Recent',
    settings: 'Settings',
    collapse: 'Collapse',
    expand: 'Expand',
    newNote: 'New Note',
    search: 'Search...',
    manageWorkspaces: 'Manage Workspaces',
    newWorkspace: 'New',

    // Settings
    generalSettings: 'General Settings',
    appearance: 'Appearance',
    keyboardShortcuts: 'Keyboard Shortcuts',
    workspaceSettings: 'Workspace Settings',
    workspaceName: 'Workspace Name',
    description: 'Description',
    applicationInfo: 'Application Info',
    version: 'Version',
    storage: 'Storage',
    aboutOrqelis: 'About Orqelis',
    aboutText: 'Orqelis is a technical knowledge management platform designed for developers. It combines note-taking with code snippets, knowledge graphs, and a developer-friendly console interface. All data is stored locally in your browser using IndexedDB.',
    exportData: 'Export Data',
    exportText: 'Download a full backup including all workspaces, groups, notes, and snippets.',
    exportButton: 'Export All Data',
    importData: 'Import Data',
    importText: 'Restore from a full backup file. This will merge or update existing workspaces, groups, notes, and snippets.',
    importButton: 'Import from File',
    dangerZone: 'Danger Zone',
    dangerText: 'Permanently delete all notes, snippets, and activity. This action cannot be undone.',
    deleteButton: 'Delete All Data',
    theme: 'Theme',
    dark: 'Dark',
    light: 'Light',
    accentColor: 'Accent Color',
    accentText: 'Primary accent color for highlights and interactive elements.',
    applyChanges: 'Apply Changes',
    applied: 'Applied!',
    language: 'Language',
    selectLanguage: 'Select your preferred language',
    english: 'English',
    spanish: 'Spanish',
    dashboardTitle: 'Dashboard',
    dashboardSub: 'Overview of your knowledge base and recent activity.',
    totalNotes: 'Total Notes',
    totalSnippets: 'Snippets',
    connections: 'Connections',
    recentNotes: 'Recent Notes',
    viewAll: 'View all',
    topTechs: 'Top Technologies',
    noTechs: 'No technologies detected yet',
    quickActions: 'Quick Actions',
    orphanNotes: 'Orphan Notes',
    orphanSub: 'notes without connections',
    popularSnippets: 'Popular Snippets',
    uses: 'uses',
    welcome: 'Welcome',
    localStorageActive: 'Local Storage Active',
    searchNotes: 'Search notes...',
    developer: 'Developer',
    getStarted: 'Get Started',
    technicalPlatform: 'Technical Knowledge Platform',
    heroSubtitle: 'Advanced technical notes and architectural visualization for developers. Connect your thoughts, code, and documentation.',
    localFirst: 'Local First',
    worksOffline: 'Works offline',
    quickSearch: 'Quick search',
    authSystemFound: '[[Auth System]] found',
    smartNotes: 'Smart Technical Notes',
    smartNotesDesc: 'Write documentation with code snippets, diagrams, and bidirectional links.',
    knowledgeGraphDesc: 'Visualize connections between notes, modules, and architecture.',
    devConsoleDesc: 'Execute commands, navigate notes, and manage your knowledge base.',
    snippetLibrary: 'Snippet Library',
    snippetLibraryDesc: 'Save and organize reusable code snippets with syntax highlighting.',
    documentation: 'Documentation',
    changelog: 'Changelog',
    myWorkspacePlaceholder: 'My Workspace',
    workspaceDescPlaceholder: 'Workspace description...',
    groupNamePlaceholder: 'e.g. Frontend, Auth, Infra…',
    docs: 'Documentation',
    code: 'Code',
    idea: 'Idea',
    arch: 'Architecture',
    loading: 'Loading...',
    cancel: 'Cancel',
    ok: 'OK',
    error: 'Error',
    tags: 'Tags',
    databaseManagement: 'Database Management',
    connectionError: 'Connection Error',
    connectionErrorDesc: 'We are having trouble connecting to the database server. Some features may be limited, but you can still work locally.',
    connectionRetry: 'Retry Connection',
    databaseOffline: 'Database Offline',
    dbNotConfigured: 'Database Not Configured',
    dbConfigRequired: 'A database connection (SQLite) is required before you can log in. If the server is already running, make sure you have completed the initial setup.',
    dbConfigLink: 'Configure Database',
    serverStatus: 'Server Status',
    dbStatus: 'Database Status',
    connected: 'Connected',
    disconnected: 'Disconnected',
    checking: 'Checking...',
    // Command Palette
    goDashboard: 'Go to Dashboard',
    goNotes: 'Go to Notes',
    goGraph: 'Go to Graph View',
    goSnippets: 'Go to Snippets',
    goConsole: 'Go to Dev Console',
    goSettings: 'Go to Settings',
    createNewNote: 'Create New Note',
    searchPlaceholder: 'Search notes, snippets, or commands...',
    noResults: 'No results found for',
    navigate: 'Navigate',
    select: 'Select',
    close: 'Close',

    // Dev Console
    consoleHeader: 'Developer Console',
    consoleWelcome: 'Welcome to the Orqelis Developer Console.',
    consoleHelpCmd: "Type 'help' to see available commands or 'tutorial' for a system guide.",
    availableCommands: 'AVAILABLE COMMANDS',
    noteOperations: 'Note Operations',
    systemCustomization: 'System & Customization',
    data: 'Data',
    tips: 'Tips',
    tabAutocomplete: 'Use Tab for autocomplete',
    upDownHistory: 'Use Up/Down arrows for command history',
    themeChanged: 'Theme changed to',
    availableWorkspaces: 'Available Workspaces',
    switchedToWorkspace: 'Switched to workspace',
    workspaceNotFound: 'Workspace not found',
    notificationSent: 'Notification sent!',
    consoleCleared: 'Console cleared.',
    navigatedTo: 'Navigated to',
    noNotesFound: 'No notes found',
    noNotesInCategory: 'No notes found in category',
    createFirstNoteWith: 'Create your first note with',
    foundNotes: 'Found notes',
    foundResultsFor: 'Found results for',
    noteNotFound: 'Note not found',
    openedNote: 'Opened note',
    createdNewNote: 'Created new note',
    deletedNote: 'Deleted note',
    toggledFavorite: 'Toggled favorite for',
    knowledgeBaseStats: 'KNOWLEDGE BASE STATS',
    byCategory: 'BY CATEGORY',
    linksFor: 'Links for',
    outgoing: 'OUTGOING',
    incoming: 'INCOMING',
    noOrphanNotes: 'No orphan notes! All notes are connected.',
    foundOrphanNotes: 'Found orphan notes (no connections)',
    addLinksTip: 'Tip: Add [[links]] to connect these notes.',
    noRecentActivity: 'No recent activity',
    recentActivity: 'Recent Activity',
    exportSuccess: 'Data exported successfully!',
    unknownCommand: 'Unknown command',

    // Graph View
    knowledgeGraph: 'Knowledge Graph',
    nodes: 'Nodes',
    codes: 'Codes',
    links: 'Links',
    hideSnippets: 'Hide code snippets',
    showSnippets: 'Show code snippets',
    hideOrphans: 'Hide orphan notes',
    showOrphans: 'Show orphan notes',
    filterCategory: 'Filter by Category',
    filterGroup: 'Filter by Group',
    allCategories: 'All Categories',
    allGroups: 'All Groups',
    openNote: 'Open Note',
    noNotesYet: 'No Notes Yet',
    graphWelcome: 'Create notes with [[bidirectional links]] to see your knowledge graph come to life.',

    // Dev Console Tutorial
    tutorialTitle: 'SYSTEM GUIDE & TUTORIAL',
    tutorialIndex: `Welcome to Orqelis. Choose a topic to learn more:
- 'tutorial notes'     : Create and manage technical notes
- 'tutorial snippets'  : Save and link code fragments
- 'tutorial graph'     : Connect ideas with bidirectional links
- 'tutorial console'   : Master the command line interface
- 'tutorial styles'    : Learn Markdown and note styling

Type 'help' to see the full list of available commands.`,
    tutorialNotes: `MASTERING TECHNICAL NOTES: FROM START TO FINISH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. CREATION:
   - Command: 'new <title>' to create instantly from console.
   - Button: Use 'New Note' in the sidebar.

2. WRITING & STYLING:
   - Use 'tutorial styles' to see all Markdown options.
   - All changes are saved automatically in your local database.

3. CONNECTIVITY (THE CORE):
   - **Internal Links**: Type [[Note Title]] to link notes. These
     links are case-insensitive and create clickable shortcuts.
   - **Code Snippets**: Link reusable blocks via 'Link Snippet'.
   - **Visualizing**: Every link creates an edge in the Graph.

4. ORGANIZATION:
   - **Groups**: Cluster related notes (e.g. 'Frontend', 'Database').
   - **Categories**: Define the type of note (Docs, Code, Arch, Idea).
   - **Tags**: Add multiple tags for advanced filtering.

5. ADVANCED CONSOLE OPS:
   - 'list [category]': List all notes or filter by category.
   - 'search <query>': Global search across all technical notes.
   - 'open <title>': Jump to any note instantly.
   - 'inspect <title>': View UUID, timestamps, and metadata.
   - 'favorite <title>': Add to your favorites list.
   - 'links <title>': Audit all incoming and outgoing connections.
   - 'orphans': Find notes that aren't connected to anything yet.

6. DELETION:
   - 'delete <title>' or use the trash icon in the editor.`,
    tutorialSnippets: `1. SNIPPET LIBRARY:
   Store reusable code blocks with syntax highlighting.
2. LINKING:
   In a note, use 'Link Code' to attach snippets. They will also appear in the
   Graph View as connected purple nodes.
3. QUICK COPY:
   Click the copy icon to instantly send code to your clipboard.`,
    tutorialGraph: `1. NODES & EDGES:
   - Notes are colored by category.
   - Snippets are shown as purple nodes.
   - Lines represent [[bidirectional links]].
2. NAVIGATION:
   Drag to pan, scroll to zoom. Click any node to open its editor/viewer.
3. GROUPS:
   Items in the same Group are visually clustered to show architectural relationships.`,
    tutorialConsole: `1. NAVIGATION:
   'dashboard', 'notes', 'snippets', 'graph', 'settings'.
2. POWER SEARCH:
   'search <query>' scans titles, content, and tags.
3. GRAPH UTILS:
   - 'links <title>': View all connections for a specific note.
   - 'orphans': Find notes that aren't connected to anything yet.
4. TIPS:
   - Use 'TAB' to autocomplete commands.
   - Use 'Up/Down' arrows to navigate history.`,
    tutorialStyles: `HOW TO STYLE YOUR NOTES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. HEADERS:
   # Main Title (H1)
   ## Section (H2)
   ### Sub-section (H3)

2. TEXT FORMATTING:
   - **Bold text** for emphasis.
   - *Italic text* for subtle notes.
   - ~~Strikethrough~~ for deprecated info.
   - > Blockquotes for citations or architectural decisions.

3. TECHNICAL CONTENT:
   - Inline \`code\` for variables or small commands.
   - Blocks:
     \`\`\`typescript
     const orqelis = "powered by code";
     \`\`\`

4. BIDIRECTIONAL LINKS:
   - Type [[Target Note]] to create a link. If the note exists,
     it becomes a clickable shortcut and shows in the Graph.

5. LISTS & TASKS:
   - Bullet points with '-' or '*'.
   - Task lists with '- [ ]'.`,

    // Group Manager
    manageGroups: 'Manage Groups',
    manageGroupsSub: 'Create, edit and delete groups. Notes can be moved between them from the editor.',
    editGroup: 'Edit group',
    newGroup: 'New group',
    name: 'Name',
    optional: 'Optional',
    color: 'Color',
    saveChanges: 'Save changes',
    createGroup: 'Create group',
    deleteGroup: 'Delete Group',
    allGroupsList: 'All groups',
    noGroupsYet: 'No groups yet',
    deleteGroupConfirm: 'Delete group? Notes will become ungrouped.',
    confirm: 'Confirm',

    // Note Editor
    deleteNoteConfirm: 'Are you sure you want to delete this note?',
    clearGroupFilter: 'Clear group filter',
    noNotesInGroup: 'No notes in',
    createFirstNote: 'Create your first note',
    notesSaved: 'notes saved',
    searchNotesPlaceholder: 'Search notes by title, content or tags...',
    noNotesMatchSearch: 'Try adjusting your search query or filters.',
    characters: 'characters',
    words: 'words',
    saveAndClose: 'Save & Close',
    noteTitlePlaceholder: 'Note title...',
    unsaved: 'Unsaved',
    saved: 'Saved',
    editMode: 'Edit mode',
    previewMode: 'Preview mode',
    noGroup: 'No group',
    noGroupsDefined: 'No groups defined',
    assignGroup: 'Assign group',
    toggleSidebarLabel: 'Toggle sidebar',
    showNotes: 'Show Notes',
    hideNotes: 'Hide Notes',
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',
    proPlan: 'Pro Plan',
    addTag: 'Add tag...',
    more: 'more',
    noContentYet: 'No content yet...',
    noteNotFoundEditor: 'Note not found',
    linkSnippet: 'Link Snippet',
    noSnippetsAvailable: 'No snippets available to link',
    relatedSnippets: 'Related Snippets',
    linkNote: 'Link Note',
    relatedNotes: 'Related Notes',
    noNotesAvailable: 'No notes available to link',

    // Snippets View
    codeSnippets: 'Code Snippets',
    snippetsSaved: 'snippets saved',
    newSnippet: 'New Snippet',
    searchSnippets: 'Search snippets...',
    filterLanguage: 'Filter by Language',
    allLanguages: 'All Languages',
    edit: 'Edit',
    copy: 'Copy',
    delete: 'Delete',
    deleteSnippetConfirm: 'Delete this snippet?',
    noSnippetsFound: 'No snippets found',
    adjustSearch: 'Try adjusting your search or filters',
    startLibrary: 'Start building your code snippet library',
    createFirstSnippet: 'Create First Snippet',
    editSnippet: 'Edit Snippet',
    createNewSnippet: 'Create New Snippet',
    createSnippet: 'Create Snippet',
    title: 'Title',
    noGroupSnippet: 'No Group',
    saveSnippet: 'Save Snippet',
    pasteCode: 'Paste your code here...',
    briefDescription: 'Brief description...',

    // Workspace Manager
    workspaces: 'Workspaces',
    workspaceSub: 'Switch between workspaces or manage them. Each workspace has its own notes and snippets.',
    editWorkspace: 'Edit workspace',
    newWorkspaceForm: 'New workspace',
    createWorkspace: 'Create Workspace',
    projectNamePlaceholder: 'Project name...',
    whatIsThisFor: 'What is this for?',
    yourWorkspaces: 'Your Workspaces',
    noDescription: 'No description',
    deleteWorkspaceConfirm: 'Delete this workspace and all its content?',
    active: 'Active',
    switchTo: 'Switch to',
    minWorkspaceError: 'You must have at least one workspace.',
    goToDashboard: 'Go to Dashboard',
    signOut: 'Sign Out',
    signIn: 'Sign In',
    welcomeBack: 'Welcome Back',
    secureAccess: 'Secure access to your development hub',
    emailAddress: 'Email Address',
    password: 'Password',
    orContinueWith: 'Or continue with',
    noAccount: "Don't have an account?",
    passwordTooShort: 'Password must be at least 6 characters',
    invalidCredentials: 'Invalid email or password',
    loginError: 'An error occurred during login',
    setup: 'Setup',
    connectionsAndAccess: 'Connections & Access',
    newConnection: 'New Connection',
    editConnection: 'Edit Connection',
    connectionName: 'Name / Identifier',
    connectionType: 'Type',
    typeSsh: 'SSH Server',
    typeWeb: 'Web Page',
    typeDatabase: 'Database',
    hostIpUrl: 'Host / IP / URL',
    port: 'Port',
    users: 'Users',
    user: 'User',
    passwords: 'Passwords',
    addCredential: 'Add User/Pass',
    noConnections: 'No connections found',
    deleteConnectionConfirm: 'Delete this connection and all associated credentials?',
    showConnections: 'Show Connections',
    hideConnections: 'Hide Connections',
    copySshCommand: 'SSH',
    openWeb: 'Open Web',
    sshCommandCopied: 'SSH command copied to clipboard',
    urlCopied: 'URL copied to clipboard',
    retry: 'Retry',
  },
  es: {
    // Sidebar
    dashboard: 'Panel de control',
    notes: 'Notas',
    graphView: 'Vista de grafo',
    snippets: 'Fragmentos',
    devConsole: 'Consola Dev',
    navigation: 'Navegación',
    groups: 'Grupos',
    allNotes: 'Todas las notas',
    favorites: 'Favoritos',
    recent: 'Recientes',
    settings: 'Configuración',
    collapse: 'Contraer',
    expand: 'Expandir',
    newNote: 'Nueva nota',
    search: 'Buscar...',
    manageWorkspaces: 'Gestionar espacios',
    newWorkspace: 'Nuevo',

    // Settings
    generalSettings: 'Configuración General',
    appearance: 'Apariencia',
    keyboardShortcuts: 'Atajos de Teclado',
    workspaceSettings: 'Configuración del Espacio',
    workspaceName: 'Nombre del Espacio',
    description: 'Descripción',
    applicationInfo: 'Información de la Aplicación',
    version: 'Versión',
    storage: 'Almacenamiento',
    aboutOrqelis: 'Sobre Orqelis',
    aboutText: 'Orqelis es una plataforma de gestión de conocimiento técnico diseñada para desarrolladores. Combina la toma de notas con fragmentos de código, grafos de conocimiento y una interfaz de consola amigable para desarrolladores. Todos los datos se almacenan localmente en su navegador usando IndexedDB.',
    exportData: 'Exportar Datos',
    exportText: 'Descargue una copia de seguridad completa que incluye todos los espacios de trabajo, grupos, notas y fragmentos.',
    exportButton: 'Exportar Todos los Datos',
    importData: 'Importar Datos',
    importText: 'Restaurar desde un archivo de copia de seguridad. Esto fusionará o actualizará los espacios de trabajo, grupos, notas y fragmentos existentes.',
    importButton: 'Importar desde Archivo',
    dangerZone: 'Zona de Peligro',
    dangerText: 'Eliminar permanentemente todas las notas, fragmentos y actividad. Esta acción no se puede deshacer.',
    deleteButton: 'Eliminar Todos los Datos',
    theme: 'Tema',
    dark: 'Oscuro',
    light: 'Claro',
    accentColor: 'Color de Acento',
    accentText: 'Color de acento principal para resaltados y elementos interactivos.',
    applyChanges: 'Aplicar Cambios',
    applied: '¡Aplicado!',
    language: 'Idioma',
    selectLanguage: 'Selecciona tu idioma preferido',
    english: 'Inglés',
    spanish: 'Español',
    dashboardTitle: 'Panel de Control',
    dashboardSub: 'Vista general de tu base de conocimientos y actividad reciente.',
    totalNotes: 'Notas Totales',
    totalSnippets: 'Fragmentos',
    connections: 'Conexiones',
    recentNotes: 'Notas Recientes',
    viewAll: 'Ver todo',
    topTechs: 'Tecnologías Principales',
    noTechs: 'No se han detectado tecnologías aún',
    quickActions: 'Acciones Rápidas',
    orphanNotes: 'Notas Huérfanas',
    orphanSub: 'notas sin conexiones',
    popularSnippets: 'Fragmentos Populares',
    uses: 'usos',
    welcome: 'Bienvenido',
    localStorageActive: 'Almacenamiento Local Activo',
    searchNotes: 'Buscar notas...',
    developer: 'Desarrollador',
    getStarted: 'Empezar',
    technicalPlatform: 'Plataforma de Conocimiento Técnico',
    heroSubtitle: 'Notas técnicas avanzadas y visualización arquitectónica para desarrolladores. Conecta tus pensamientos, código y documentación.',
    localFirst: 'Primero Local',
    worksOffline: 'Funciona sin conexión',
    quickSearch: 'Búsqueda rápida',
    authSystemFound: '[[Auth System]] encontrado',
    smartNotes: 'Notas Técnicas Inteligentes',
    smartNotesDesc: 'Escribe documentación con fragmentos de código, diagramas y enlaces bidireccionales.',
    knowledgeGraphDesc: 'Visualiza conexiones entre notas, módulos y arquitectura.',
    devConsoleDesc: 'Ejecuta comandos, navega por las notas y gestiona tu base de conocimientos.',
    snippetLibrary: 'Biblioteca de Fragmentos',
    snippetLibraryDesc: 'Guarda y organiza fragmentos de código reutilizables con resaltado de sintaxis.',
    documentation: 'Documentación',
    changelog: 'Registro de cambios',
    myWorkspacePlaceholder: 'Mi Espacio de Trabajo',
    workspaceDescPlaceholder: 'Descripción del espacio...',
    groupNamePlaceholder: 'ej. Frontend, Auth, Infra…',
    docs: 'Documentación',
    code: 'Código',
    idea: 'Idea',
    arch: 'Arquitectura',
    loading: 'Cargando...',
    cancel: 'Cancelar',
    ok: 'Aceptar',
    error: 'Error',
    tags: 'Etiquetas',
    databaseManagement: 'Gestión de Base de Datos',
    connectionError: 'Error de Conexión',
    connectionErrorDesc: 'Estamos teniendo problemas para conectar con el servidor de la base de datos. Algunas funciones pueden estar limitadas, pero puedes seguir trabajando localmente.',
    connectionRetry: 'Reintentar Conexión',
    databaseOffline: 'Base de datos Desconectada',
    dbNotConfigured: 'Base de Datos no Configurada',
    dbConfigRequired: 'Se requiere una conexión a la base de datos (SQLite) para poder iniciar sesión. Si el servidor ya está corriendo, asegúrate de haber completado la configuración inicial.',
    dbConfigLink: 'Configurar base de datos',
    serverStatus: 'Estado del Servidor',
    dbStatus: 'Estado de la Base de Datos',
    connected: 'Conectado',
    disconnected: 'Desconectado',
    checking: 'Comprobando...',
    // Command Palette
    goDashboard: 'Ir al Panel de Control',
    goNotes: 'Ir a Notas',
    goGraph: 'Ir a Vista de Grafo',
    goSnippets: 'Ir a Fragmentos',
    goConsole: 'Ir a Consola Dev',
    goSettings: 'Ir a Configuración',
    createNewNote: 'Crear Nueva Nota',
    searchPlaceholder: 'Buscar notas, fragmentos o comandos...',
    noResults: 'No se encontraron resultados para',
    navigate: 'Navegar',
    select: 'Seleccionar',
    close: 'Cerrar',

    // Dev Console
    consoleHeader: 'Consola de Desarrollador',
    consoleWelcome: 'Bienvenido a la Consola de Orqelis.',
    consoleHelpCmd: "Escribe 'help' para ver los comandos disponibles o 'tutorial' para una guía del sistema.",
    availableCommands: 'COMANDOS DISPONIBLES',
    noteOperations: 'Operaciones de Notas',
    systemCustomization: 'Sistema y Personalización',
    data: 'Datos',
    tips: 'Consejos',
    tabAutocomplete: 'Usa Tab para autocompletar',
    upDownHistory: 'Usa las flechas Arriba/Abajo para el historial',
    themeChanged: 'Tema cambiado a',
    availableWorkspaces: 'Espacios de Trabajo Disponibles',
    switchedToWorkspace: 'Cambiado al espacio',
    workspaceNotFound: 'Espacio de trabajo no encontrado',
    notificationSent: '¡Notificación enviada!',
    consoleCleared: 'Consola limpiada.',
    navigatedTo: 'Navegado a',
    noNotesFound: 'No se encontraron notas',
    noNotesInCategory: 'No se encontraron notas en la categoría',
    createFirstNoteWith: 'Crea tu primera nota con',
    foundNotes: 'Notas encontradas',
    foundResultsFor: 'Resultados encontrados para',
    noteNotFound: 'Nota no encontrada',
    openedNote: 'Nota abierta',
    createdNewNote: 'Nueva nota creada',
    deletedNote: 'Nota eliminada',
    toggledFavorite: 'Favorito cambiado para',
    knowledgeBaseStats: 'ESTADÍSTICAS DE LA BASE DE CONOCIMIENTO',
    byCategory: 'POR CATEGORÍA',
    linksFor: 'Enlaces para',
    outgoing: 'SALIENTES',
    incoming: 'ENTRANTES',
    noOrphanNotes: '¡Sin notas huérfanas! Todas las notas están conectadas.',
    foundOrphanNotes: 'Notas huérfanas encontradas (sin conexiones)',
    addLinksTip: 'Consejo: Añade [[enlaces]] para conectar estas notas.',
    noRecentActivity: 'Sin actividad reciente',
    recentActivity: 'Actividad Reciente',
    exportSuccess: '¡Datos exportados con éxito!',
    unknownCommand: 'Comando desconocido',

    // Graph View
    knowledgeGraph: 'Grafo de Conocimiento',
    nodes: 'Nodos',
    codes: 'Fragmentos',
    links: 'Enlaces',
    hideSnippets: 'Ocultar fragmentos de código',
    showSnippets: 'Mostrar fragmentos de código',
    hideOrphans: 'Ocultar notas huérfanas',
    showOrphans: 'Mostrar notas huérfanas',
    filterCategory: 'Filtrar por Categoría',
    filterGroup: 'Filtrar por Grupo',
    allCategories: 'Todas las Categorías',
    allGroups: 'Todos los Grupos',
    openNote: 'Abrir Nota',
    noNotesYet: 'Aún no hay notas',
    graphWelcome: 'Crea notas con [[enlaces bidireccionales]] para ver cómo tu grafo de conocimiento cobra vida.',

    // Dev Console Tutorial
    tutorialTitle: 'GUÍA DEL SISTEMA Y TUTORIAL',
    tutorialIndex: `Bienvenido a Orqelis. Elige un tema para aprender más:
- 'tutorial notes'     : Crear y gestionar notas técnicas
- 'tutorial snippets'  : Guardar y vincular fragmentos de código
- 'tutorial graph'     : Conectar ideas con enlaces bidireccionales
- 'tutorial console'   : Dominar la interfaz de comandos
- 'tutorial styles'    : Aprender Markdown y estilos de notas

Escribe 'help' para ver la lista completa de comandos disponibles.`,
    tutorialNotes: `DOMINANDO LAS NOTAS TÉCNICAS: DE PRINCIPIO A FIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. CREACIÓN:
   - Comando: 'new <título>' para crear al instante desde la consola.
   - Botón: Usa 'Nueva Nota' en la barra lateral.

2. ESCRITURA Y ESTILO:
   - Usa 'tutorial styles' para ver todas las opciones de Markdown.
   - Los cambios se guardan automáticamente en tu base de datos local.

3. CONECTIVIDAD (EL NÚCLEO):
   - **Enlaces Internos**: Escribe [[Título de Nota]] para vincular.
     Son insensibles a mayúsculas y crean accesos directos.
   - **Fragmentos**: Vincula bloques reutilizables con 'Vincular Código'.
   - **Visualización**: Cada enlace crea una conexión en el Grafo.

4. ORGANIZACIÓN:
   - **Grupos**: Agrupación semántica (Proyecto X, Infra, Backend).
   - **Categorías**: Tipos lógicos (Documentación, Arquitectura).
   - **Etiquetas**: Usa 'añadir etiqueta' o '#' en el editor.

5. OPERACIONES DE CONSOLA:
   - 'list [categoría]': Listar todas las notas o filtrar por categoría.
   - 'search <consulta>': Búsqueda global en todas las notas técnicas.
   - 'open <título>': Salta a cualquier nota instantáneamente.
   - 'inspect <título>': Ver metadatos técnicos (UUID, fechas) de la nota.
   - 'favorite <título>': Añadir a tu lista de favoritos.
   - 'links <título>': Auditar todas las conexiones entrantes/salientes.
   - 'orphans': Encontrar notas que aún no están conectadas a nada.

6. ELIMINACIÓN:
   - 'delete <título>' o usa el icono de papelera en el editor.`,
    tutorialSnippets: `1. BIBLIOTECA DE FRAGMENTOS:
   Guarda bloques de código reutilizables con resaltado de sintaxis.
2. VINCULACIÓN:
   En una nota, usa 'Vincular Código'. Estos también aparecerán en la
   Vista de Grafo como nodos púrpuras conectados.
3. COPIA RÁPIDA:
   Haz clic en el icono de copiar para enviar el código al portapapeles.`,
    tutorialGraph: `1. NODOS Y ENLACES:
   - Las notas están coloreadas por categoría.
   - Los fragmentos de código son nodos púrpuras.
   - Las líneas representan [[enlaces bidireccionales]].
2. NAVEGACIÓN:
   Arrastra para desplazar, usa el scroll para zoom. Clic en cualquier nodo para abrirlo.
3. GRUPOS:
   Los elementos del mismo Grupo se agrupan visualmente para mostrar relaciones.`,
    tutorialConsole: `1. NAVEGACIÓN:
   'dashboard', 'notes', 'snippets', 'graph', 'settings'.
2. BÚSQUEDA PODEROSA:
   'search <consulta>' escanea títulos, contenido y etiquetas.
3. UTILIDADES DE GRAFO:
   - 'links <título>': Ver todas las conexiones de una nota específica.
   - 'orphans': Encontrar notas que aún no están conectadas a nada.
4. CONSEJOS:
   - Usa 'TAB' para autocompletar comandos.
   - Usa las flechas 'Arriba/Abajo' para navegar por el historial.`,
    tutorialStyles: `CÓMO DAR ESTILO A TUS NOTAS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ENCABEZADOS:
   # Título Principal (H1)
   ## Sección (H2)
   ### Sub-sección (H3)

2. FORMATO DE TEXTO:
   - **Texto en negrita** para enfatizar.
   - *Texto en itálica* para notas sutiles.
   - ~~Tachado~~ para información obsoleta.
   - > Citas para decisiones de arquitectura.

3. CONTENIDO TÉCNICO:
   - \`código en línea\` para variables o comandos cortos.
   - Bloques:
     \`\`\`typescript
     const orqelis = "powered by code";
     \`\`\`

4. ENLACES BIDIRECCIONALES:
   - Escribe [[Nota Destino]] para crear un enlace. Si la nota
     existe, se vuelve un acceso directo y aparece en el Grafo.

5. LISTAS Y TAREAS:
   - Viñetas con '-' o '*'.
   - Listas de tareas con '- [ ]'.`,

    // Group Manager
    manageGroups: 'Gestionar Grupos',
    manageGroupsSub: 'Crea, edita y elimina grupos. Las notas pueden moverse entre ellos desde el editor.',
    editGroup: 'Editar grupo',
    newGroup: 'Nuevo grupo',
    name: 'Nombre',
    optional: 'Opcional',
    color: 'Color',
    saveChanges: 'Guardar cambios',
    createGroup: 'Crear grupo',
    deleteGroup: 'Eliminar Grupo',
    allGroupsList: 'Todos los grupos',
    noGroupsYet: 'Aún no hay grupos',
    deleteGroupConfirm: '¿Eliminar grupo? Las notas dejarán de estar agrupadas.',
    confirm: 'Confirmar',

    // Note Editor
    deleteNoteConfirm: '¿Estás seguro de que quieres eliminar esta nota?',
    clearGroupFilter: 'Limpiar filtro de grupo',
    noNotesInGroup: 'Sin notas en',
    createFirstNote: 'Crea tu primera nota',
    notesSaved: 'notas guardadas',
    searchNotesPlaceholder: 'Buscar notas por título, contenido o etiquetas...',
    noNotesMatchSearch: 'Prueba a ajustar tu búsqueda o filtros.',
    characters: 'caracteres',
    words: 'palabras',
    saveAndClose: 'Guardar y Cerrar',
    noteTitlePlaceholder: 'Título de la nota...',
    unsaved: 'Sin guardar',
    saved: 'Guardado',
    editMode: 'Modo edición',
    previewMode: 'Modo vista previa',
    noGroup: 'Sin grupo',
    noGroupsDefined: 'No hay grupos definidos',
    assignGroup: 'Asignar grupo',
    toggleSidebarLabel: 'Alternar barra lateral',
    showNotes: 'Mostrar Notas',
    hideNotes: 'Ocultar Notas',
    switchToLight: 'Cambiar a modo claro',
    switchToDark: 'Cambiar a modo oscuro',
    proPlan: 'Plan Pro',
    addTag: 'Añadir etiqueta...',
    more: 'más',
    noContentYet: 'Aún no hay contenido...',
    noteNotFoundEditor: 'Nota no encontrada',
    linkSnippet: 'Vincular Código',
    noSnippetsAvailable: 'No hay códigos disponibles para vincular',
    relatedSnippets: 'Códigos Relacionados',
    linkNote: 'Vincular Nota',
    relatedNotes: 'Notas Relacionadas',
    noNotesAvailable: 'No hay notas disponibles para vincular',

    // Snippets View
    codeSnippets: 'Fragmentos de Código',
    snippetsSaved: 'fragmentos guardados',
    newSnippet: 'Nuevo Fragmento',
    searchSnippets: 'Buscar fragmentos...',
    filterLanguage: 'Filtrar por Lenguaje',
    allLanguages: 'Todos los Lenguajes',
    edit: 'Editar',
    copy: 'Copiar',
    delete: 'Eliminar',
    deleteSnippetConfirm: '¿Eliminar este fragmento?',
    noSnippetsFound: 'No se encontraron fragmentos',
    adjustSearch: 'Intenta ajustar tu búsqueda o filtros',
    startLibrary: 'Comienza a construir tu biblioteca de fragmentos',
    createFirstSnippet: 'Crear Primer Fragmento',
    editSnippet: 'Editar Fragmento',
    createNewSnippet: 'Crear Nuevo Fragmento',
    createSnippet: 'Crear Fragmento',
    title: 'Título',
    noGroupSnippet: 'Sin Grupo',
    saveSnippet: 'Guardar Fragmento',
    pasteCode: 'Pega tu código aquí...',
    briefDescription: 'Breve descripción...',

    // Workspace Manager
    workspaces: 'Espacios de Trabajo',
    workspaceSub: 'Cambia entre espacios de trabajo o gestiónalos. Cada espacio tiene sus propias notas y fragmentos.',
    editWorkspace: 'Editar espacio',
    newWorkspaceForm: 'Nuevo espacio de trabajo',
    createWorkspace: 'Crear Espacio de Trabajo',
    projectNamePlaceholder: 'Nombre del proyecto...',
    whatIsThisFor: '¿Para qué es esto?',
    yourWorkspaces: 'Tus Espacios de Trabajo',
    noDescription: 'Sin descripción',
    deleteWorkspaceConfirm: '¿Eliminar este espacio de trabajo y todo su contenido?',
    active: 'Activo',
    switchTo: 'Cambiar a',
    minWorkspaceError: 'Debes tener al menos un espacio de trabajo.',
    goToDashboard: 'Ir al Dashboard',
    signOut: 'Cerrar Sesión',
    signIn: 'Iniciar Sesión',
    welcomeBack: 'Bienvenido de nuevo',
    secureAccess: 'Acceso seguro a tu centro de desarrollo',
    emailAddress: 'Correo Electrónico',
    password: 'Contraseña',
    orContinueWith: 'O continuar con',
    noAccount: '¿No tienes una cuenta?',
    passwordTooShort: 'La contraseña debe tener al menos 6 caracteres',
    invalidCredentials: 'Correo o contraseña inválidos',
    loginError: 'Ocurrió un error al iniciar sesión',
    setup: 'Configuración',
    connectionsAndAccess: 'Conexiones y Accesos',
    newConnection: 'Nueva Conexión',
    editConnection: 'Editar Conexión',
    connectionName: 'Nombre / Identificador',
    connectionType: 'Tipo',
    typeSsh: 'Servidor SSH',
    typeWeb: 'Página Web',
    typeDatabase: 'Base de Datos',
    hostIpUrl: 'Host / IP / URL',
    port: 'Puerto',
    users: 'Usuarios',
    user: 'Usuario',
    passwords: 'Contraseñas',
    addCredential: 'Añadir Usuario/Contraseña',
    noConnections: 'No se encontraron conexiones',
    deleteConnectionConfirm: '¿Eliminar esta conexión y todas sus credenciales asociadas?',
    showConnections: 'Mostrar Conexiones',
    hideConnections: 'Ocultar Conexiones',
    copySshCommand: 'SSH',
    openWeb: 'Abrir Web',
    sshCommandCopied: 'Comando SSH copiado al portapapeles',
    urlCopied: 'URL copiada al portapapeles',
    retry: 'Reintentar',
  }
};

export type TranslationKey = keyof typeof translations.en;

export const t = (key: TranslationKey, lang: Language): string => {
  const dict = translations[lang] as Record<TranslationKey, string>;
  return dict[key] || translations.en[key] || key;
};
