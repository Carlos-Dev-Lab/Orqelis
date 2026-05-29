import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Server, 
  Plus, 
  Trash2, 
  Search, 
  Edit3, 
  Key,
  Globe,
  ChevronDown,
  ChevronUp,
  User,
  ShieldCheck,
  X,
  Eye,
  EyeOff,
  FileText,
  Code2,
  Copy,
  Check,
  ExternalLink,
  Laptop,
  Database
} from 'lucide-react';
import { cn } from '@/shared/utils';
import { useAppStore } from '@/shared/store';
import { t } from '@/shared/i18n';
import type { Connection, Credential } from '@orqelis/shared';
import { Tooltip } from '@/shared/components/Tooltip';

interface ConnectionCardProps {
  conn: Connection;
  language: any;
  onEdit: (conn: Connection) => void;
  onDelete: (id: string) => void;
}

function ConnectionCard({ conn, language, onEdit, onDelete }: ConnectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { addNotification } = useAppStore();

  const togglePasswordVisibility = (credId: string) => {
    setVisiblePasswords(prev => ({ ...prev, [credId]: !prev[credId] }));
  };

  const copySshCommand = (id: string, user: string, host: string, port: number) => {
    const cmd = `ssh -p ${port} ${user}@${host}`;
    navigator.clipboard.writeText(cmd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    addNotification({
      title: t('copySshCommand', language),
      message: t('sshCommandCopied', language),
      type: 'success'
    });
  };

  const openWeb = (url: string) => {
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      finalUrl = `https://${url}`;
    }
    window.open(finalUrl, '_blank');
  };

  const copyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    addNotification({
      title: t('openWeb', language),
      message: t('urlCopied', language),
      type: 'success'
    });
  };

  const isWeb = conn.type === 'web';
  const isDatabase = conn.type === 'database';
  const isSsh = conn.type === 'ssh';

  const typeColor = isWeb ? 'var(--secondary)' : isDatabase ? 'var(--color-database)' : 'var(--primary)';

  return (
    <motion.div
      layout
      className="inline-block w-full bg-surface-container-low border border-on-surface/5 rounded-2xl p-4 hover:border-primary/30 transition-all group"
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0">
            {isWeb ? (
              <Globe className="w-4 h-4 text-secondary" />
            ) : isDatabase ? (
              <Database className="w-4 h-4 text-[var(--color-database)]" />
            ) : (
              <Server className="w-4 h-4 text-primary" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Tooltip content={conn.name} color={typeColor}>
              <h3 className="font-bold text-on-surface truncate">{conn.name}</h3>
            </Tooltip>
            <Tooltip 
              content={`${conn.host}${!isWeb && conn.port ? `:${conn.port}` : ''}`}
              color={typeColor}
            >
              <p className="text-xs text-on-surface-variant font-mono truncate">
                {conn.host}{!isWeb && conn.port ? `:${conn.port}` : ''}
              </p>
            </Tooltip>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button 
            onClick={() => onEdit(conn)}
            className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-primary transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(conn.id)}
            className="p-1.5 hover:bg-error/10 rounded-lg text-on-surface-variant hover:text-error transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
           <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 flex items-center justify-between px-3 py-2 bg-surface-container-high rounded-xl text-xs font-medium text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <div className="flex items-center gap-2">
              <Key className="w-3 h-3" />
              <span>{conn.credentials?.length || 0} {t('users', language)}</span>
            </div>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          
          {isWeb && (
            <button
              onClick={() => openWeb(conn.host)}
              className="px-3 py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-xl transition-colors text-xs font-bold flex items-center gap-2"
              title={t('openWeb', language)}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t('openWeb', language)}
            </button>
          )}
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2 space-y-2">
                {conn.credentials?.map((cred, idx) => (
                  <div key={cred.id || idx} className="p-3 bg-surface-container rounded-xl border border-on-surface/5">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 text-xs text-on-surface font-semibold min-w-0 flex-1">
                        <User className="w-3 h-3 text-primary flex-shrink-0" />
                        <span className="truncate">{cred.username}</span>
                      </div>
                      <motion.button
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        onClick={() => {
                          if (isWeb) {
                            copyUrl(cred.id || `${conn.id}-${idx}`, conn.host);
                          } else if (isDatabase) {
                            // Copying database connection info or just host
                            navigator.clipboard.writeText(conn.host);
                            setCopiedId(cred.id || `${conn.id}-${idx}`);
                            setTimeout(() => setCopiedId(null), 2000);
                            addNotification({
                              title: t('typeDatabase', language),
                              message: t('urlCopied', language),
                              type: 'success'
                            });
                          } else {
                            copySshCommand(cred.id || `${conn.id}-${idx}`, cred.username, conn.host, conn.port || 22);
                          }
                        }}
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors text-[10px] font-bold uppercase tracking-wider min-w-[60px] justify-center flex-shrink-0",
                          isWeb ? "bg-secondary/10 hover:bg-secondary/20 text-secondary" 
                          : isDatabase ? "bg-[var(--color-database)]/10 hover:bg-[var(--color-database)]/20 text-[var(--color-database)]"
                          : "bg-primary/10 hover:bg-primary/20 text-primary"
                        )}
                        title={isWeb ? t('openWeb', language) : isDatabase ? t('typeDatabase', language) : t('copySshCommand', language)}
                      >
                        {copiedId === (cred.id || `${conn.id}-${idx}`) ? (
                          <>
                            <Check className="w-3 h-3" />
                            {language === 'en' ? 'COPIED' : 'COPIADO'}
                          </>
                        ) : (
                          <>
                            {isWeb ? <Copy className="w-3 h-3" /> : isDatabase ? <Database className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {isWeb ? 'URL' : isDatabase ? 'DB' : 'SSH'}
                          </>
                        )}
                      </motion.button>
                    </div>
                    
                    {cred.password && (
                      <div className="flex items-center justify-between gap-2 text-[10px] text-on-surface-variant font-mono bg-surface-container-lowest p-1.5 rounded-lg group/pass">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-3 h-3" />
                          {visiblePasswords[cred.id] ? cred.password : cred.password.replace(/./g, '•')}
                        </div>
                        <button
                          onClick={() => togglePasswordVisibility(cred.id)}
                          className="p-1 hover:bg-on-surface/5 rounded-md transition-colors"
                        >
                          {visiblePasswords[cred.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function ConnectionsView() {
  const {
    connections,
    notes,
    snippets,
    createConnection,
    updateConnection,
    deleteConnection,
    activeConnectionId,
    setActiveConnectionId,
    language,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingConn, setEditingConn] = useState<Partial<Connection> | null>(null);
  const [editingCreds, setEditingCreds] = useState<Partial<Credential>[]>([]);
  const [showEditPasswords, setShowEditPasswords] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (activeConnectionId) {
      const conn = connections.find(c => c.id === activeConnectionId);
      if (conn) {
        handleEdit(conn);
      }
    }
  }, [activeConnectionId, connections]);

  const filteredConnections = useMemo(() => {
    if (!searchQuery) return connections;
    const q = searchQuery.toLowerCase();
    return connections.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.host.toLowerCase().includes(q)
    );
  }, [connections, searchQuery]);

  const handleOpenNew = () => {
    setEditingConn({ name: '', type: 'ssh', host: '', port: 22, noteIds: [], snippetIds: [] });
    setEditingCreds([{ username: '', password: '' }]);
    setIsEditing(true);
  };

  const handleEdit = (conn: Connection) => {
    setEditingConn(conn);
    setEditingCreds(conn.credentials || []);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editingConn?.name || !editingConn?.host) return;

    if (editingConn.id) {
      await updateConnection(editingConn.id, editingConn, editingCreds as any);
    } else {
      await createConnection(editingConn, editingCreds as any);
    }
    setIsEditing(false);
    setEditingConn(null);
    setEditingCreds([]);
    setActiveConnectionId(null);
  };

  const handleDelete = (id: string) => {
    useAppStore.getState().showConfirm(
      t('confirm', language),
      t('deleteConnectionConfirm', language),
      () => deleteConnection(id)
    );
  };

  const addCredentialField = () => {
    setEditingCreds([...editingCreds, { username: '', password: '' }]);
  };

  const removeCredentialField = (index: number) => {
    setEditingCreds(editingCreds.filter((_, i) => i !== index));
  };

  return (
    <div className="h-full flex flex-col bg-surface-container-lowest overflow-hidden">
      <header className="px-6 py-4 border-b border-on-surface/5 bg-surface-container-lowest/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Laptop className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-surface">{t('connectionsAndAccess', language)}</h2>
              <p className="text-xs text-on-surface-variant">{connections.length} {t('connectionsAndAccess', language).toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            {t('newConnection', language)}
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder={t('searchNotesPlaceholder', language)}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container rounded-xl border-none focus:ring-2 focus:ring-primary/20 text-sm"
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {filteredConnections.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-on-surface-variant opacity-50">
            <Laptop className="w-16 h-16 mb-4" />
            <p>{t('noConnections', language)}</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4">
            {filteredConnections.map((conn) => (
              <div key={conn.id} className="break-inside-avoid mb-4">
                <ConnectionCard
                  conn={conn}
                  language={language}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditing(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-surface-container-lowest rounded-3xl shadow-2xl overflow-hidden border border-on-surface/10"
            >
              <div className="px-6 py-4 border-b border-on-surface/5 flex items-center justify-between">
                <h3 className="text-lg font-bold text-on-surface">
                  {editingConn?.id ? t('editConnection', language) : t('newConnection', language)}
                </h3>
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-surface-container rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant px-1 uppercase tracking-wider">{t('connectionName', language)}</label>
                      <input
                        type="text"
                        value={editingConn?.name || ''}
                        onChange={(e) => setEditingConn({ ...editingConn, name: e.target.value })}
                        className="w-full px-4 py-2.5 bg-surface-container rounded-xl border-none focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                        placeholder="Production Server"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant px-1 uppercase tracking-wider">{t('connectionType', language)}</label>
                      <select
                        value={editingConn?.type || 'ssh'}
                        onChange={(e) => {
                          const newType = e.target.value as 'ssh' | 'web' | 'database';
                          setEditingConn({ 
                            ...editingConn, 
                            type: newType,
                            port: newType === 'ssh' ? (editingConn?.port || 22) 
                                  : newType === 'database' ? (editingConn?.port || 3306)
                                  : null
                          });
                        }}
                        className="w-full px-4 py-2.5 bg-surface-container rounded-xl border-none focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                      >
                        <option value="ssh">{t('typeSsh', language)}</option>
                        <option value="web">{t('typeWeb', language)}</option>
                        <option value="database">{t('typeDatabase', language)}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant px-1 uppercase tracking-wider">{t('hostIpUrl', language)}</label>
                      <input
                        type="text"
                        value={editingConn?.host || ''}
                        onChange={(e) => setEditingConn({ ...editingConn, host: e.target.value })}
                        className="w-full px-4 py-2.5 bg-surface-container rounded-xl border-none focus:ring-2 focus:ring-primary/20 transition-all shadow-inner font-mono"
                        placeholder={editingConn?.type === 'web' ? "https://github.com" : "192.168.1.100"}
                      />
                    </div>
                    {editingConn?.type !== 'web' && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-on-surface-variant px-1 uppercase tracking-wider">{t('port', language)}</label>
                        <input
                          type="number"
                          value={editingConn?.port ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingConn({ ...editingConn, port: val === '' ? null : parseInt(val) });
                          }}
                          className="w-full px-4 py-2.5 bg-surface-container rounded-xl border-none focus:ring-2 focus:ring-primary/20 transition-all shadow-inner font-mono"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant px-1 uppercase tracking-wider">{t('relatedNotes', language)}</label>
                    <div className="flex flex-wrap gap-2 p-3 bg-surface-container-low rounded-2xl border border-on-surface/5">
                      {notes.map(note => {
                        const isLinked = (editingConn?.noteIds || []).includes(note.id);
                        return (
                          <button
                            key={note.id}
                            onClick={() => {
                              const currentIds = editingConn?.noteIds || [];
                              const newIds = isLinked 
                                ? currentIds.filter(id => id !== note.id)
                                : [...currentIds, note.id];
                              setEditingConn({ ...editingConn!, noteIds: newIds });
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2",
                              isLinked 
                                ? "bg-primary text-on-primary shadow-lg shadow-primary/20" 
                                : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
                            )}
                          >
                            <FileText className="w-3 h-3" />
                            {note.title}
                          </button>
                        );
                      })}
                      {notes.length === 0 && <p className="text-[10px] text-on-surface-variant italic">{t('noNotesAvailable', language)}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant px-1 uppercase tracking-wider">{t('relatedSnippets', language)}</label>
                    <div className="flex flex-wrap gap-2 p-3 bg-surface-container-low rounded-2xl border border-on-surface/5">
                      {snippets.map(snippet => {
                        const isLinked = (editingConn?.snippetIds || []).includes(snippet.id);
                        return (
                          <button
                            key={snippet.id}
                            onClick={() => {
                              const currentIds = editingConn?.snippetIds || [];
                              const newIds = isLinked 
                                ? currentIds.filter(id => id !== snippet.id)
                                : [...currentIds, snippet.id];
                              setEditingConn({ ...editingConn!, snippetIds: newIds });
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2",
                              isLinked 
                                ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20" 
                                : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
                            )}
                          >
                            <Code2 className="w-3 h-3" />
                            {snippet.title}
                          </button>
                        );
                      })}
                      {snippets.length === 0 && <p className="text-[10px] text-on-surface-variant italic">{t('noSnippetsAvailable', language)}</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('users', language)} & {t('passwords', language)}</label>
                    <button 
                      onClick={addCredentialField}
                      className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest bg-primary/10 px-2 py-1 rounded-lg"
                    >
                      {t('addCredential', language)}
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {editingCreds.map((cred, idx) => (
                      <div key={idx} className="p-4 bg-surface-container-low rounded-2xl border border-on-surface/5 relative group/cred">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-on-surface-variant uppercase px-1">{t('user', language)}</label>
                            <input
                              type="text"
                              autoComplete="off"
                              value={cred.username}
                              onChange={(e) => {
                                const newCreds = [...editingCreds];
                                newCreds[idx].username = e.target.value;
                                setEditingCreds(newCreds);
                              }}
                              className="w-full px-3 py-2 bg-surface-container rounded-xl border-none text-sm focus:ring-1 focus:ring-primary/20"
                              placeholder="admin"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-on-surface-variant uppercase px-1">{t('password', language)}</label>
                            <div className="relative">
                              <input
                                type={showEditPasswords[idx] ? "text" : "password"}
                                autoComplete="new-password"
                                value={cred.password}
                                onChange={(e) => {
                                  const newCreds = [...editingCreds];
                                  newCreds[idx].password = e.target.value;
                                  setEditingCreds(newCreds);
                                }}
                                className="w-full px-3 py-2 pr-10 bg-surface-container rounded-xl border-none text-sm focus:ring-1 focus:ring-primary/20"
                                placeholder="••••••••"
                              />
                              <button
                                type="button"
                                onClick={() => setShowEditPasswords(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-on-surface/5 rounded-md transition-colors text-on-surface-variant"
                              >
                                {showEditPasswords[idx] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                        {editingCreds.length > 1 && (
                          <button
                            onClick={() => removeCredentialField(idx)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-error text-on-error rounded-full flex items-center justify-center opacity-0 group-hover/cred:opacity-100 transition-opacity shadow-lg"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-surface-container-high/50 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setActiveConnectionId(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  {t('cancel', language)}
                </button>
                <button
                  onClick={handleSave}
                  disabled={!editingConn?.name || !editingConn?.host}
                  className="px-6 py-2 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 text-sm font-bold disabled:opacity-50 disabled:shadow-none"
                >
                  {t('saveChanges', language)}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
