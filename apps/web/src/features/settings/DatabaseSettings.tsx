import { Database, Server, CheckCircle, FileText, Code, Folder, Layers } from 'lucide-react';
import { useAppStore } from '@/shared/store';

export function DatabaseSettings() {
  const { 
    language, 
    notes,
    snippets,
    workspaces,
    groups,
    isAuthenticated
  } = useAppStore();
  
  const stats = {
    notes: notes.length,
    snippets: snippets.length,
    workspaces: workspaces.length,
    groups: groups.length,
    total: notes.length + snippets.length + workspaces.length + groups.length
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <h4 className="font-semibold text-on-surface mb-2 flex items-center gap-2">
          <Server className="w-5 h-5 text-primary" />
          {language === 'es' ? 'Fuente de Verdad: Servidor' : 'Source of Truth: Server'}
        </h4>
        <p className="text-sm text-on-surface-variant mb-4">
          {language === 'es' 
            ? 'Orqelis utiliza una arquitectura Server-First. Todos tus datos se almacenan de forma segura en el servidor y se sincronizan en tiempo real.'
            : 'Orqelis uses a Server-First architecture. All your data is securely stored on the server and synchronized in real-time.'}
        </p>
        
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 text-success font-medium w-fit">
          <CheckCircle className="w-4 h-4" />
          {isAuthenticated ? (language === 'es' ? 'Conectado al servidor' : 'Connected to server') : (language === 'es' ? 'Modo Invitado' : 'Guest Mode')}
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-bold text-on-surface">{language === 'es' ? 'Resumen de Datos' : 'Data Summary'}</h5>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-on-surface/5 border border-on-surface/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-xs font-bold text-on-surface">{stats.notes}</div>
                <div className="text-[10px] text-on-surface-variant">{language === 'es' ? 'Notas' : 'Notes'}</div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-on-surface/5 border border-on-surface/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Code className="w-4 h-4 text-secondary" />
              </div>
              <div>
                <div className="text-xs font-bold text-on-surface">{stats.snippets}</div>
                <div className="text-[10px] text-on-surface-variant">{language === 'es' ? 'Snippets' : 'Snippets'}</div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-on-surface/5 border border-on-surface/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center">
                <Layers className="w-4 h-4 text-tertiary" />
              </div>
              <div>
                <div className="text-xs font-bold text-on-surface">{stats.groups}</div>
                <div className="text-[10px] text-on-surface-variant">{language === 'es' ? 'Grupos' : 'Groups'}</div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-on-surface/5 border border-on-surface/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Folder className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-xs font-bold text-on-surface">{stats.workspaces}</div>
                <div className="text-[10px] text-on-surface-variant">{language === 'es' ? 'Espacios' : 'Workspaces'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
        <div className="flex gap-3">
          <Database className="w-5 h-5 text-primary shrink-0" />
          <div>
            <h5 className="text-sm font-bold text-on-surface">{language === 'es' ? 'Arquitectura del Sistema' : 'System Architecture'}</h5>
            <p className="text-xs text-on-surface-variant mt-1">
              {language === 'es'
                ? 'El sistema está configurado para usar una base de datos centralizada. El almacenamiento local solo se usa para preferencias visuales no críticas.'
                : 'The system is configured to use a centralized database. Local storage is only used for non-critical visual preferences.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
