import { useState, useEffect } from 'react';
import { 
  Database, HardDrive, Download, RefreshCw, 
  Info, CheckCircle, FileJson, Upload, AlertCircle, XCircle
} from 'lucide-react';
import { cn } from '@/shared/utils';
import { useAppStore } from '@/shared/store';
import { api } from '@/shared/api';
import { useRef } from 'react';

export function StorageManager() {
  const { 
    user, isServerOnline, isDbOnline, workspaces, notes, snippets, 
    groups, recentActivity, notifications, connections, loadData, activeWorkspaceId 
  } = useAppStore() as any;
  const [counts, setCounts] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportSelection, setExportSelection] = useState({
    // El workspace se elige con el selector y SIEMPRE se incluye en el archivo exportado
    groups: true,
    notes: true,
    snippets: true,
    connections: true,
    notifications: true,
    activities: true
  });
  // Workspace a exportar (por defecto, el activo)
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [importSelection, setImportSelection] = useState<any>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleExportItem = (key: string) => {
    setExportSelection(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const exportData = async () => {
    try {
      const wsId = selectedWorkspaceId || activeWorkspaceId || workspaces?.[0]?.id;
      if (!wsId) {
        setImportResults({ error: 'No hay ningún Workspace seleccionado para exportar.' });
        return;
      }
      const ws = workspaces?.find((w: any) => w.id === wsId);

      const data: any = {
        exportDate: new Date().toISOString(),
        user: user?.email || 'anonymous',
        metadata: {
          app: 'Orqelis',
          version: '2.0.0',
          scope: 'workspace',
          workspaceId: wsId,
          workspaceName: ws?.name || 'workspace'
        }
      };

      // Exportar SIEMPRE el workspace seleccionado para mantener el contexto en la importación
      if (ws) data.workspaces = [ws];
      if (exportSelection.groups) data.groups = (groups || []).filter((g: any) => g.workspaceId === wsId);
      if (exportSelection.notes) data.notes = (notes || []).filter((n: any) => n.workspaceId === wsId);
      if (exportSelection.snippets) data.snippets = (snippets || []).filter((s: any) => s.workspaceId === wsId);
      if (exportSelection.connections) data.connections = (connections || []).filter((c: any) => c.workspaceId === wsId);
      if (exportSelection.notifications) {
        // Algunas notificaciones pueden no tener workspaceId; exportar solo las relacionadas
        const scoped = (notifications || []).filter((n: any) => !('workspaceId' in n) || n.workspaceId === wsId);
        if (scoped.length) data.notifications = scoped;
      }
      if (exportSelection.activities) {
        // Las actividades pueden no tener workspaceId; exportar solo aquellas cuyo entity pertenece
        const allowedIds = new Set<string>([
          ...(data.notes || []).map((n: any) => n.id),
          ...(data.snippets || []).map((s: any) => s.id),
          ...(data.groups || []).map((g: any) => g.id),
        ]);
        const scopedActs = (recentActivity || []).filter((a: any) => allowedIds.has(a.entityId));
        if (scopedActs.length) data.activities = scopedActs;
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const selectionText = Object.entries(exportSelection)
        .filter(([_, v]) => v)
        .map(([k]) => k.substring(0, 2))
        .join('-');
      const wsSlug = (ws?.name || 'workspace').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      a.href = url;
      a.download = `orqelis-${wsSlug}-export-${selectionText}-${new Date().getTime()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setShowExportOptions(false);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setImportResults({ error: 'El archivo debe ser un formato JSON (.json)' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        let data;
        try {
          data = JSON.parse(content);
        } catch (parseErr) {
          throw new Error('El archivo no es un JSON válido.');
        }

        // Show preview instead of immediate import
        setImportPreview(data);
        const initialSelection: any = {};
        ['workspaces', 'groups', 'notes', 'snippets', 'connections', 'notifications', 'activities'].forEach(key => {
          if (Array.isArray(data[key]) && data[key].length > 0) {
            initialSelection[key] = true;
          }
        });
        setImportSelection(initialSelection);
      } catch (err: any) {
        setImportResults({ error: err.message });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const executeImport = async () => {
    if (!importPreview) return;
    
    setIsLoading(true);
    setImportResults(null);
    
    try {
      // Filter data based on selection
      const filteredData: any = {};
      Object.keys(importSelection).forEach(key => {
        if (importSelection[key]) {
          filteredData[key] = importPreview[key];
        }
      });

      // Asegurar que el backend reciba el workspace necesario para mapear IDs
      const needsWorkspace = (
        filteredData.groups || filteredData.notes || filteredData.snippets || filteredData.connections
      ) && !filteredData.workspaces && Array.isArray(importPreview.workspaces) && importPreview.workspaces.length > 0;
      if (needsWorkspace) {
        filteredData.workspaces = importPreview.workspaces;
      }

      const results = await api.import.importData(filteredData);
      setImportResults(results);
      setImportPreview(null);
      
      if (loadData) await loadData();
      await fetchStats();
    } catch (err: any) {
      setImportResults({ error: err.message || 'Error al importar' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      setCounts({ 
        workspaces: workspaces?.length || 0,
        notes: notes?.length || 0,
        snippets: snippets?.length || 0,
        groups: groups?.length || 0,
        notifications: notifications?.length || 0,
        activities: recentActivity?.length || 0,
        connections: connections?.length || 0,
      });
    } catch (err) {
      console.error('Failed to fetch storage stats', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [workspaces, notes, snippets, groups, notifications, connections, recentActivity]);

  return (
    <div className="space-y-6">
      {importResults && (
        <div className={cn(
          "glass-card p-6 rounded-xl border mb-6 transition-all animate-in fade-in slide-in-from-top-4",
          importResults.error ? "border-error/20 bg-error/5" : "border-success/20 bg-success/5"
        )}>
          <div className="flex items-center justify-between mb-4">
            <h5 className="font-semibold flex items-center gap-2">
              {importResults.error ? (
                <>
                  <XCircle className="w-5 h-5 text-error" />
                  <span className="text-error">Error en la Importación</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="text-success">Importación Completada</span>
                </>
              )}
            </h5>
            <button 
              onClick={() => setImportResults(null)}
              className="text-on-surface-variant hover:text-on-surface p-1"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>

          {importResults.error ? (
            <p className="text-sm text-error/80">{importResults.error}</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-white/5 rounded-lg border border-on-surface/5 min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-on-surface-variant truncate">Total</div>
                  <div className="text-xl font-bold truncate">{importResults.total}</div>
                </div>
                <div className="p-3 bg-success/5 rounded-lg border border-success/10 min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-success/70 truncate">Éxitos</div>
                  <div className="text-xl font-bold text-success truncate">{importResults.successCount}</div>
                </div>
                <div className="p-3 bg-error/5 rounded-lg border border-error/10 min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-error/70 truncate">Fallos</div>
                  <div className="text-xl font-bold text-error truncate">{importResults.errorCount}</div>
                </div>
              </div>

              {importResults.errorCount > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-on-surface-variant flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Detalles de errores:
                  </span>
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                    {importResults.details.filter((r: any) => !r.success).map((res: any, i: number) => (
                      <div key={i} className="text-xs p-2 bg-error/10 rounded border border-error/10 text-error flex justify-between gap-4">
                        <span className="font-medium shrink-0">{res.type} [{res.name || res.id}]:</span>
                        <span className="truncate italic opacity-80">{res.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-on-surface flex items-center gap-2 min-w-0">
          <HardDrive className="w-5 h-5 text-primary shrink-0" />
          <span className="truncate">Almacenamiento (Server-First)</span>
        </h4>
        <button 
          onClick={fetchStats}
          className="p-2 hover:bg-on-surface/5 rounded-full transition-colors"
          disabled={isLoading}
        >
          <RefreshCw className={cn("w-4 h-4 text-on-surface-variant", isLoading && "animate-spin")} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-xl border border-on-surface/10 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-on-surface truncate">Arquitectura Server-First</span>
            <Info className="w-4 h-4 text-on-surface-variant shrink-0" />
          </div>
          
          <div className="space-y-2">
            <p className="text-xs text-on-surface-variant">
              Los datos se guardan de forma segura en la base de datos del servidor principal.
              La app ya no utiliza IndexedDB/Dexie localmente.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-on-surface/5 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-on-surface-variant">Estado Server:</span>
              {(isServerOnline && isDbOnline) ? (
                <span className="text-xs text-success flex items-center gap-1 font-medium">
                  <CheckCircle className="w-3 h-3" /> Online
                </span>
              ) : (
                <span className="text-xs text-error flex items-center gap-1 font-medium">
                  Offline
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 glass-card p-6 rounded-xl border border-on-surface/10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-on-surface">Elementos en Memoria</span>
            <Database className="w-4 h-4 text-primary" />
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
            {[
              { label: 'Workspaces', value: counts.workspaces },
              { label: 'Notas', value: counts.notes },
              { label: 'Snippets', value: counts.snippets },
              { label: 'Grupos', value: counts.groups },
              { label: 'Actividades', value: counts.activities },
              { label: 'Notificaciones', value: counts.notifications },
              { label: 'Conexiones', value: counts.connections },
            ].map((stat, i) => (
              <div key={i} className="p-3 bg-on-surface/5 rounded-lg border border-on-surface/5 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-on-surface-variant mb-1 break-words leading-tight min-h-[1.25rem]">{stat.label}</div>
                <div className="text-lg font-bold text-on-surface truncate">{stat.value || 0}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 pt-2">
        <div className="w-full flex flex-col gap-4">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setShowExportOptions(!showExportOptions)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                showExportOptions ? "bg-primary text-on-primary" : "bg-on-surface/5 hover:bg-on-surface/10 text-on-surface"
              )}
            >
              <FileJson className="w-4 h-4" />
              <span>Configurar Exportación</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-all"
            >
              <Upload className={cn("w-4 h-4", isLoading && "animate-pulse")} />
              <span>Importar Backup (JSON)</span>
            </button>
          </div>

          {showExportOptions && (
            <div className="glass-card p-4 rounded-xl border border-primary/20 animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-semibold text-on-surface">Seleccionar datos a exportar</h5>
                <button 
                  onClick={exportData}
                  className="px-3 py-1 bg-primary text-on-primary rounded-md text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Descargar JSON
                </button>
              </div>
              {/* Selección de Workspace */}
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center mb-3">
                <label className="text-xs text-on-surface-variant">Workspace:</label>
                <select
                  className="px-2 py-1 rounded border border-on-surface/10 bg-on-surface/5 text-sm"
                  value={selectedWorkspaceId || activeWorkspaceId || ''}
                  onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                >
                  {(workspaces || []).map((w: any) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.keys(exportSelection).map((key) => (
                  <label key={key} className="flex items-center gap-2 p-2 hover:bg-on-surface/5 rounded cursor-pointer transition-colors min-w-0">
                    <input 
                      type="checkbox" 
                      checked={exportSelection[key as keyof typeof exportSelection]} 
                      onChange={() => toggleExportItem(key)}
                      className="accent-primary shrink-0"
                    />
                    <span className="text-xs capitalize text-on-surface-variant truncate" title={key}>{key}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImportFileChange} 
          className="hidden" 
          accept=".json"
        />
      </div>

      {/* Import Preview Overlay */}
      {importPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface/80 backdrop-blur-md animate-in fade-in">
          <div className="glass-card w-full max-w-lg p-6 rounded-2xl border border-on-surface/10 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileJson className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface">Previsualización de Importación</h3>
                  <p className="text-xs text-on-surface-variant">Confirma qué datos deseas añadir a tu cuenta</p>
                </div>
              </div>
              <button onClick={() => setImportPreview(null)} className="p-1 hover:bg-on-surface/5 rounded-full">
                <XCircle className="w-6 h-6 text-on-surface-variant" />
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 mb-4">
                <div className="flex items-center gap-2 text-xs text-primary font-medium mb-1">
                  <Info className="w-3 h-3" /> Metadatos del archivo
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-on-surface-variant">
                  <div className="truncate">Usuario Origen: <span className="text-on-surface font-medium truncate" title={importPreview.user || 'Desconocido'}>{importPreview.user || 'Desconocido'}</span></div>
                  <div className="truncate">Fecha: <span className="text-on-surface font-medium truncate">{importPreview.exportDate ? new Date(importPreview.exportDate).toLocaleDateString() : 'N/A'}</span></div>
                  {(
                    (importPreview?.metadata && (importPreview.metadata.workspaceName || importPreview.metadata.workspaceId)) ||
                    (Array.isArray(importPreview?.workspaces) && importPreview.workspaces[0])
                  ) && (
                    <div className="truncate sm:col-span-2">Workspace en archivo: {(
                      importPreview?.metadata?.workspaceName || importPreview?.workspaces?.[0]?.name || 'N/A'
                    )} <span className="opacity-70">[
                      {importPreview?.metadata?.workspaceId || importPreview?.workspaces?.[0]?.id || '—'}
                    ]</span></div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {['workspaces', 'groups', 'notes', 'snippets', 'connections', 'notifications', 'activities'].map(key => {
                  const count = Array.isArray(importPreview[key]) ? importPreview[key].length : 0;
                  if (count === 0) return null;
                  
                  return (
                    <label key={key} className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                      importSelection[key] ? "border-primary bg-primary/5" : "border-on-surface/5 bg-on-surface/5 opacity-60"
                    )}>
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={!!importSelection[key]} 
                          onChange={() => setImportSelection((prev: any) => ({ ...prev, [key]: !prev[key] }))}
                          className="accent-primary"
                        />
                        <span className="text-xs font-semibold capitalize text-on-surface">{key}</span>
                      </div>
                      <span className="text-xs font-bold bg-white/10 px-2 py-0.5 rounded-full">{count}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setImportPreview(null)}
                className="flex-1 px-4 py-2.5 bg-on-surface/5 hover:bg-on-surface/10 text-on-surface rounded-xl text-sm font-bold transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={executeImport}
                disabled={isLoading || !Object.values(importSelection).some(v => v)}
                className="flex-[2] px-4 py-2.5 bg-primary hover:bg-primary/90 text-on-primary rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Confirmar e Importar
              </button>
            </div>
            
            <p className="mt-4 text-[10px] text-center text-on-surface-variant italic">
              * Los datos importados se asignarán automáticamente a tu usuario ({user?.email})
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
