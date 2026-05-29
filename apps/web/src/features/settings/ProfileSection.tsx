import { useState } from 'react';
import { 
  User, Shield, Save, Loader2, Camera, LogOut, 
  Database 
} from 'lucide-react';
import { useAppStore } from '@/shared/store';
import { api } from '@/shared/api';

export function ProfileSection() {
  const { 
    user, 
    addNotification, 
    logout, 
    showConfirm,
    language
  } = useAppStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    image: user?.image || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.auth.updateProfile(formData);
      addNotification({
        title: language === 'es' ? 'Perfil actualizado' : 'Profile updated',
        message: language === 'es' ? 'Tus cambios se han guardado correctamente.' : 'Your changes have been saved successfully.',
        type: 'success',
      });
    } catch (err: any) {
      addNotification({
        title: 'Error',
        message: err.message || (language === 'es' ? 'No se pudo actualizar el perfil.' : 'Failed to update profile.'),
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    showConfirm(
      language === 'es' ? '¿Cerrar Sesión?' : 'Sign Out?',
      language === 'es' ? '¿Estás seguro de que deseas cerrar sesión?' : 'Are you sure you want to sign out?',
      () => logout(),
      undefined,
      language === 'es' ? 'Cerrar Sesión' : 'Sign Out',
      language === 'es' ? 'Cancelar' : 'Cancel'
    );
  };

  if (!user) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* User Overview */}
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start p-6 rounded-2xl bg-on-surface/5 border border-on-surface/5">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-4 border-primary/20">
            {user.image ? (
              <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-primary" />
            )}
          </div>
          <button 
            className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-on-primary shadow-lg hover:scale-110 transition-transform"
            onClick={() => {
              const url = prompt(language === 'es' ? 'Introduce la URL de tu nueva imagen de perfil:' : 'Enter your new profile image URL:', user.image || '');
              if (url !== null) setFormData({ ...formData, image: url });
            }}
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 text-center md:text-left space-y-2">
          <h3 className="text-2xl font-bold text-on-surface">{user.name || 'Usuario'}</h3>
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            <span className="px-2 py-0.5 rounded bg-on-surface/10 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              {user.role}
            </span>
            {user.role === 'admin' && <Shield className="w-4 h-4 text-primary" />}
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              {language === 'es' ? 'Cerrar Sesión' : 'Logout'}
            </button>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6 glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-2 text-on-surface font-semibold">
          <Save className="w-4 h-4 text-primary" />
          <h4>{language === 'es' ? 'Editar Información' : 'Edit Information'}</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-on-surface-variant ml-1">
              {language === 'es' ? 'Nombre' : 'Name'}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 rounded-xl bg-on-surface/5 border border-on-surface/10 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-on-surface-variant ml-1">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-2 rounded-xl bg-on-surface/5 border border-on-surface/10 text-on-surface-variant opacity-60 cursor-not-allowed"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-on-surface-variant ml-1">
              {language === 'es' ? 'URL de Imagen' : 'Image URL'}
            </label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-4 py-2 rounded-xl bg-on-surface/5 border border-on-surface/10 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || (formData.name === user.name && formData.image === user.image)}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-on-primary font-bold hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg shadow-primary/20"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {language === 'es' ? 'Guardar Cambios' : 'Save Changes'}
          </button>
        </div>
      </form>

      <div className="flex justify-center pt-4">
        <div className="flex items-center gap-2 text-[10px] text-on-surface-variant font-mono">
          <Database className="w-3 h-3" />
          <span>Orqelis v1.1.0</span>
          <span className="w-1 h-1 rounded-full bg-on-surface/20" />
          <span>LOCALLY ENCRYPTED</span>
        </div>
      </div>
    </div>
  );
}
