import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, Shield, ShieldCheck, Trash2, RefreshCw, User as UserIcon, 
  Search, Filter, HardDrive, History, LogOut, Ban, CheckCircle,
  Database, UserPlus, X, Save
} from 'lucide-react';
import { cn } from '@/shared/utils';
import { api } from '@/shared/api';
import { useAppStore } from '@/shared/store';

type AdminTab = 'users' | 'audit';

export function AdminPanel() {
  const { addNotification } = useAppStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Create user state
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Selected user details
  const [selectedUserStorage, setSelectedUserStorage] = useState<any>(null);
  const [selectedUserSessions, setSelectedUserSessions] = useState<any[]>([]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await api.admin.listUsers();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const data = await api.admin.listAuditLogs();
      if (data && Array.isArray(data.logs)) {
        setAuditLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    else fetchAuditLogs();
  }, [activeTab]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password) {
      addNotification({ title: 'Error', message: 'Email y contraseña son obligatorios', type: 'error' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const created = await api.admin.createUser(newUser);
      setUsers([created, ...users]);
      setIsCreatingUser(false);
      setNewUser({ name: '', email: '', password: '', role: 'user' });
      addNotification({ title: 'Éxito', message: 'Usuario creado correctamente', type: 'success' });
    } catch (err: any) {
      addNotification({ title: 'Error', message: err.message || 'No se pudo crear el usuario', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (id: string, updates: any) => {
    try {
      await api.admin.updateUser(id, updates);
      setUsers(users.map(u => u.id === id ? { ...u, ...updates } : u));
      addNotification({
        title: 'Usuario Actualizado',
        message: 'Los cambios se han guardado correctamente.',
        type: 'success',
      });
    } catch (err) {
      addNotification({
        title: 'Error',
        message: 'No se pudo actualizar el usuario.',
        type: 'error',
      });
    }
  };

  const handleSoftDelete = async (id: string) => {
    useAppStore.getState().showConfirm(
      '¿Confirmar eliminación?',
      '¿Estás seguro de desactivar y marcar como eliminado a este usuario?',
      async () => {
        try {
          await api.admin.deleteUser(id);
          setUsers(users.map(u => u.id === id ? { ...u, deletedAt: new Date(), isActive: false } : u));
          addNotification({
            title: 'Usuario Desactivado',
            message: 'El usuario ha sido marcado como eliminado.',
            type: 'success',
          });
        } catch (err) {
          addNotification({
            title: 'Error',
            message: 'No se pudo eliminar el usuario.',
            type: 'error',
          });
        }
      }
    );
  };

  const handlePurgeData = async (id: string) => {
    const confirmation = prompt('Esta acción es IRREVERSIBLE. Escribe "ELIMINAR DATOS" para confirmar:');
    if (confirmation !== 'ELIMINAR DATOS') return;
    
    try {
      await api.admin.purgeUserData(id);
      setUsers(users.filter(u => u.id !== id));
      addNotification({
        title: 'Datos Purgados',
        message: 'Toda la información del usuario ha sido borrada.',
        type: 'success',
      });
    } catch (err) {
      addNotification({
        title: 'Error',
        message: 'No se pudo purgar la información.',
        type: 'error',
      });
    }
  };

  const viewStorage = async (userId: string) => {
    try {
      const data = await api.admin.getUserStorage(userId);
      setSelectedUserStorage(data);
    } catch (err) {
      addNotification({ title: 'Error', message: 'No se pudo obtener el almacenamiento', type: 'error' });
    }
  };

  const viewSessions = async (userId: string) => {
    try {
      const data = await api.admin.getUserSessions(userId);
      setSelectedUserSessions(data);
    } catch (err) {
      addNotification({ title: 'Error', message: 'No se pudieron obtener las sesiones', type: 'error' });
    }
  };

  const revokeAllSessions = async (userId: string) => {
    useAppStore.getState().showConfirm(
      '¿Cerrar sesiones?',
      '¿Cerrar todas las sesiones de este usuario?',
      async () => {
        try {
          await api.admin.revokeAllUserSessions(userId);
          setSelectedUserSessions([]);
          addNotification({ title: 'Éxito', message: 'Sesiones revocadas', type: 'success' });
        } catch (err) {
          addNotification({ title: 'Error', message: 'Fallo al revocar sesiones', type: 'error' });
        }
      }
    );
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(search.toLowerCase()) || 
                         (u.name && u.name.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    const matchesStatus = statusFilter === 'active' ? u.isActive && !u.deletedAt :
                         statusFilter === 'disabled' ? !u.isActive && !u.deletedAt :
                         statusFilter === 'deleted' ? u.deletedAt : true;
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (isLoading && users.length === 0 && auditLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-on-surface-variant">Cargando datos de administración...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-on-surface/5 rounded-lg overflow-x-auto no-scrollbar max-w-full">
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              activeTab === 'users' ? "bg-surface text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <Users className="w-4 h-4" />
            Usuarios
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              activeTab === 'audit' ? "bg-surface text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <History className="w-4 h-4" />
            Auditoría
          </button>
        </div>
        {activeTab === 'users' && (
          <button 
            onClick={() => setIsCreatingUser(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-background rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo Usuario</span>
          </button>
        )}
        <button 
          onClick={activeTab === 'users' ? fetchUsers : fetchAuditLogs}
          className="p-2 hover:bg-on-surface/5 rounded-full transition-colors"
          title="Actualizar"
        >
          <RefreshCw className={cn("w-4 h-4 text-on-surface-variant", isLoading && "animate-spin")} />
        </button>
      </div>

      {activeTab === 'users' ? (
        <>
          {isCreatingUser && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-on-surface/5 p-6 rounded-xl border border-primary/20 mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  Crear Nuevo Usuario
                </h3>
                <button 
                  onClick={() => setIsCreatingUser(false)}
                  className="p-1 hover:bg-on-surface/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-on-surface-variant" />
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-on-surface-variant ml-1">Nombre</label>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={newUser.name}
                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-on-surface/10 rounded-lg text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-on-surface-variant ml-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="email@ejemplo.com"
                    value={newUser.email}
                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-on-surface/10 rounded-lg text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-on-surface-variant ml-1">Contraseña *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Min. 8 caracteres"
                    value={newUser.password}
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-on-surface/10 rounded-lg text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-on-surface-variant ml-1">Rol</label>
                  <select
                    value={newUser.role}
                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-on-surface/10 rounded-lg text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div className="md:col-span-2 lg:col-span-4 flex justify-end gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingUser(false)}
                    className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2 bg-primary text-background rounded-lg text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Guardar Usuario
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          <div className="flex flex-wrap items-center gap-4 bg-on-surface/5 p-4 rounded-xl">
            <div className="relative flex-1 min-w-[200px] w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface border border-on-surface/10 rounded-lg text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <Filter className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="flex-1 sm:flex-none min-w-[120px] bg-surface border border-on-surface/10 rounded-lg text-sm py-2 px-3 focus:outline-none focus:border-primary"
              >
                <option value="">Todos los roles</option>
                <option value="user">Usuario</option>
                <option value="admin">Admin</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 sm:flex-none min-w-[120px] bg-surface border border-on-surface/10 rounded-lg text-sm py-2 px-3 focus:outline-none focus:border-primary"
              >
                <option value="">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="disabled">Deshabilitados</option>
                <option value="deleted">Eliminados (Soft)</option>
              </select>
            </div>
          </div>

          <div className="glass-card rounded-xl overflow-hidden border border-on-surface/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-on-surface/10 bg-on-surface/5">
                    <th className="px-6 py-4 text-sm font-semibold text-on-surface">Usuario</th>
                    <th className="px-6 py-4 text-sm font-semibold text-on-surface">Proveedor</th>
                    <th className="px-6 py-4 text-sm font-semibold text-on-surface">Rol</th>
                    <th className="px-6 py-4 text-sm font-semibold text-on-surface">Estado</th>
                    <th className="px-6 py-4 text-sm font-semibold text-on-surface text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-on-surface/5">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className={cn(
                      "hover:bg-on-surface/5 transition-colors",
                      user.deletedAt && "opacity-60 bg-on-surface/[0.02]"
                    )}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {user.image ? (
                              <img 
                                src={user.image} 
                                className="w-9 h-9 rounded-full border border-on-surface/10 object-cover" 
                                alt={user.name}
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full border border-on-surface/10 flex items-center justify-center bg-primary/10">
                                <UserIcon className="w-5 h-5 text-primary" />
                              </div>
                            )}
                            {user.emailVerified && (
                              <div className="absolute -bottom-0.5 -right-0.5 bg-success rounded-full p-0.5 border-2 border-surface">
                                <CheckCircle className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-on-surface truncate" title={user.name}>{user.name}</div>
                            <div className="text-xs text-on-surface-variant truncate" title={user.email}>{user.email}</div>
                            {user.lastLoginAt && (
                              <div className="text-[10px] text-on-surface-variant mt-0.5 truncate">
                                Login: {new Date(user.lastLoginAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs capitalize px-2 py-0.5 rounded bg-on-surface/5 border border-on-surface/10">
                          {user.provider || 'local'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleUpdateUser(user.id, { role: user.role === 'admin' ? 'user' : 'admin' })}
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                            user.role === 'admin' 
                              ? "bg-primary/20 text-primary border border-primary/20" 
                              : "bg-on-surface/10 text-on-surface-variant border border-on-surface/10"
                          )}
                        >
                          {user.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                          {user.role === 'admin' ? 'Admin' : 'Usuario'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleUpdateUser(user.id, { isActive: !user.isActive })}
                            disabled={!!user.deletedAt}
                            className={cn(
                              "px-2.5 py-1 rounded-full text-xs font-medium transition-all text-center",
                              user.isActive 
                                ? "bg-success/20 text-success border border-success/20" 
                                : "bg-error/20 text-error border border-error/20"
                            )}
                          >
                            {user.isActive ? 'Habilitado' : 'Deshabilitado'}
                          </button>
                          {user.deletedAt && (
                            <span className="text-[10px] text-error font-medium text-center">Eliminado (Soft)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => viewStorage(user.id)}
                            className="p-1.5 text-on-surface-variant hover:bg-on-surface/5 rounded-lg transition-colors"
                            title="Ver Almacenamiento"
                          >
                            <HardDrive className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => viewSessions(user.id)}
                            className="p-1.5 text-on-surface-variant hover:bg-on-surface/5 rounded-lg transition-colors"
                            title="Ver Sesiones"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSoftDelete(user.id)}
                            className="p-1.5 text-error hover:bg-error/10 rounded-lg transition-colors"
                            title="Soft Delete"
                            disabled={!!user.deletedAt}
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePurgeData(user.id)}
                            className="p-1.5 text-error hover:bg-error/20 rounded-lg transition-colors"
                            title="PURGAR TODO"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="py-12 text-center text-on-surface-variant">
                  No se encontraron usuarios con esos filtros.
                </div>
              )}
            </div>
          </div>

          {/* User Detail Sections */}
          {(selectedUserStorage || selectedUserSessions.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {selectedUserStorage && (
                <div className="glass-card p-4 sm:p-6 rounded-xl border border-on-surface/10">
                  <div className="flex items-center justify-between mb-4 gap-4">
                    <div className="flex flex-col min-w-0">
                      <h5 className="font-semibold text-on-surface flex items-center gap-2 truncate">
                        <Database className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="truncate">Resumen de Almacenamiento</span>
                      </h5>
                      {selectedUserStorage.userEmail && (
                        <span className="text-[10px] text-on-surface-variant ml-6 truncate" title={selectedUserStorage.userEmail}>{selectedUserStorage.userEmail}</span>
                      )}
                    </div>
                    <button onClick={() => setSelectedUserStorage(null)} className="text-xs text-on-surface-variant hover:text-on-surface flex-shrink-0">Cerrar</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="p-3 bg-on-surface/5 rounded-lg border border-on-surface/5 min-w-0">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant mb-1 truncate">Workspaces</div>
                      <div className="text-xl font-bold text-on-surface truncate">{selectedUserStorage.workspaces}</div>
                    </div>
                    <div className="p-3 bg-on-surface/5 rounded-lg border border-on-surface/5 min-w-0">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant mb-1 truncate">Notas</div>
                      <div className="text-xl font-bold text-on-surface truncate">{selectedUserStorage.notes}</div>
                    </div>
                    <div className="p-3 bg-on-surface/5 rounded-lg border border-on-surface/5 min-w-0">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant mb-1 truncate">Snippets</div>
                      <div className="text-xl font-bold text-on-surface truncate">{selectedUserStorage.snippets}</div>
                    </div>
                    <div className="p-3 bg-on-surface/5 rounded-lg border border-on-surface/5 min-w-0">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant mb-1 truncate">Conexiones</div>
                      <div className="text-xl font-bold text-on-surface truncate">{selectedUserStorage.connections || 0}</div>
                    </div>
                    <div className="p-3 bg-on-surface/5 rounded-lg border border-on-surface/5 min-w-0">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant mb-1 truncate">Grupos</div>
                      <div className="text-xl font-bold text-on-surface truncate">{selectedUserStorage.groups}</div>
                    </div>
                    <div className="p-3 bg-on-surface/5 rounded-lg border border-on-surface/5 min-w-0">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant mb-1 truncate">Tamaño Est.</div>
                      <div className="text-xl font-bold text-on-surface truncate" title={`${(selectedUserStorage.estimatedSize / 1024).toFixed(1)} KB`}>
                        {(selectedUserStorage.estimatedSize / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedUserSessions.length > 0 && (
                <div className="glass-card p-4 sm:p-6 rounded-xl border border-on-surface/10">
                  <div className="flex items-center justify-between mb-4 gap-4">
                    <h5 className="font-semibold text-on-surface flex items-center gap-2 truncate">
                      <LogOut className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="truncate">Sesiones Activas</span>
                    </h5>
                    <div className="flex gap-3 flex-shrink-0">
                      <button 
                        onClick={() => revokeAllSessions(selectedUserSessions[0].userId)}
                        className="text-xs text-error hover:underline"
                      >
                        Revocar Todas
                      </button>
                      <button onClick={() => setSelectedUserSessions([])} className="text-xs text-on-surface-variant hover:text-on-surface">Cerrar</button>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                    {selectedUserSessions.map(s => (
                      <div key={s.id} className="text-xs p-2 bg-on-surface/5 rounded border border-on-surface/10 flex justify-between items-center gap-2">
                        <div className="min-w-0">
                          <div className="font-medium truncate" title={s.userAgent || 'Desconocido'}>{s.userAgent || 'Desconocido'}</div>
                          <div className="text-[10px] text-on-surface-variant truncate">{s.ipAddress} • {new Date(s.createdAt).toLocaleString()}</div>
                        </div>
                        {s.revokedAt ? (
                          <span className="text-error shrink-0">Revocada</span>
                        ) : (
                          <span className="text-success shrink-0">Activa</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden border border-on-surface/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-on-surface/10 bg-on-surface/5">
                  <th className="px-6 py-4 text-sm font-semibold text-on-surface">Fecha</th>
                  <th className="px-6 py-4 text-sm font-semibold text-on-surface">Actor</th>
                  <th className="px-6 py-4 text-sm font-semibold text-on-surface">Acción</th>
                  <th className="px-6 py-4 text-sm font-semibold text-on-surface">Status</th>
                  <th className="px-6 py-4 text-sm font-semibold text-on-surface">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-on-surface/5">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-on-surface/5 transition-colors">
                    <td className="px-6 py-4 text-xs text-on-surface-variant whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 min-w-0">
                      <div className="text-sm text-on-surface truncate" title={log.user?.name || log.actorEmail || 'Sistema'}>{log.user?.name || log.actorEmail || 'Sistema'}</div>
                      {log.actorUserId && <div className="text-[10px] text-on-surface-variant truncate max-w-[100px]" title={log.actorUserId}>{log.actorUserId}</div>}
                    </td>
                    <td className="px-6 py-4 min-w-0">
                      <span className={cn(
                        "text-xs font-mono font-medium truncate block",
                        log.severity === 'critical' ? 'text-error font-bold' : 
                        log.severity === 'warning' ? 'text-warning' : 'text-on-surface'
                      )} title={log.action}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded uppercase font-bold",
                        log.status === 'success' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
                      )}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant whitespace-nowrap">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {auditLogs.length === 0 && (
              <div className="py-12 text-center text-on-surface-variant">
                No hay registros de auditoría.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
