import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutGrid, Plus, X, Trash2, Edit3, Check, FolderOpen, MousePointer2 } from 'lucide-react';
import { useAppStore } from '@/shared/store';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/utils';
import type { Workspace } from '@orqelis/shared';

const COLOR_PALETTE = [
  '#22d3ee', '#a78bfa', '#f472b6', '#fb7185', '#fb923c',
  '#facc15', '#4ade80', '#34d399', '#60a5fa', '#818cf8',
];

interface WorkspaceManagerProps {
  open: boolean;
  onClose: () => void;
}

type FormState = {
  id: string | null;
  name: string;
  description: string;
  color: string;
  icon: string;
};

const emptyForm: FormState = {
  id: null,
  name: '',
  description: '',
  color: COLOR_PALETTE[0],
  icon: 'folder',
};

export function WorkspaceManager({ open, onClose }: WorkspaceManagerProps) {
  const { workspaces, activeWorkspaceId, createWorkspace, updateWorkspace, deleteWorkspace, switchWorkspace, language } = useAppStore();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(emptyForm);
      setPendingDelete(null);
    }
  }, [open]);

  const isEditing = form.id !== null;

  const startEdit = (workspace: Workspace) => {
    setForm({
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      color: workspace.color,
      icon: workspace.icon,
    });
    setPendingDelete(null);
  };

  const resetForm = () => setForm(emptyForm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || busy) return;
    setBusy(true);
    try {
      if (form.id) {
        await updateWorkspace(form.id, {
          name: form.name.trim(),
          description: form.description.trim(),
          color: form.color,
          icon: form.icon,
        });
      } else {
        await createWorkspace({
          name: form.name.trim(),
          description: form.description.trim(),
          color: form.color,
          icon: form.icon,
        });
      }
      resetForm();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (workspaces.length <= 1) {
      useAppStore.getState().showAlert(t('error', language), t('minWorkspaceError', language));
      return;
    }
    setBusy(true);
    try {
      await deleteWorkspace(id);
      if (form.id === id) resetForm();
      setPendingDelete(null);
    } finally {
      setBusy(false);
    }
  };

  const handleSwitch = async (id: string) => {
    if (id === activeWorkspaceId) return;
    setBusy(true);
    try {
      await switchWorkspace(id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-4xl max-h-[90vh] bg-surface-container-lowest border border-on-surface/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 flex items-center gap-3 border-b border-on-surface/10">
              <div className="w-9 h-9 rounded-lg bg-secondary/20 text-secondary flex items-center justify-center">
                <LayoutGrid className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-on-surface">{t('workspaces', language)}</h2>
                <p className="text-xs text-on-surface-variant">
                  {t('workspaceSub', language)}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-on-surface/10 text-on-surface-variant"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 grid md:grid-cols-[320px_1fr] gap-0 overflow-hidden">
              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="p-5 border-b md:border-b-0 md:border-r border-on-surface/10 space-y-4 overflow-y-auto custom-scrollbar"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-on-surface">
                    {isEditing ? t('editWorkspace', language) : t('newWorkspaceForm', language)}
                  </h3>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-xs text-on-surface-variant hover:text-on-surface"
                    >
                      {t('cancel', language)}
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-on-surface-variant">{t('name', language)}</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={t('projectNamePlaceholder', language)}
                    className="w-full px-3 py-2 rounded-lg bg-on-surface/5 border border-on-surface/10 focus:border-primary/50 outline-none text-sm text-on-surface placeholder:text-on-surface-variant/40"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-on-surface-variant">{t('description', language)}</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder={t('whatIsThisFor', language)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-on-surface/5 border border-on-surface/10 focus:border-primary/50 outline-none text-sm text-on-surface placeholder:text-on-surface-variant/40 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-on-surface-variant">{t('color', language)}</label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm({ ...form, color: c })}
                        className={cn(
                          'w-6 h-6 rounded-full border-2 transition-all',
                          form.color === c
                            ? 'border-on-surface scale-110'
                            : 'border-transparent hover:scale-105'
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!form.name.trim() || busy}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-primary to-secondary text-background font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isEditing ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {isEditing ? t('saveChanges', language) : t('createWorkspace', language)}
                </button>
              </form>

              {/* List */}
              <div className="p-5 overflow-y-auto custom-scrollbar">
                <h3 className="text-sm font-semibold text-on-surface mb-3">
                  {t('yourWorkspaces', language)} <span className="text-on-surface-variant/60 font-normal">({workspaces.length})</span>
                </h3>

                <div className="grid sm:grid-cols-2 gap-3">
                  {workspaces.map((w) => {
                    const isPending = pendingDelete === w.id;
                    const isActive = activeWorkspaceId === w.id;

                    return (
                      <div
                        key={w.id}
                        className={cn(
                          'group relative p-4 rounded-xl border transition-all',
                          isActive 
                            ? 'border-primary/40 bg-primary/5 shadow-lg shadow-primary/5' 
                            : 'border-on-surface/10 bg-on-surface/5 hover:border-on-surface/20'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                            style={{ backgroundColor: w.color }}
                          >
                            <FolderOpen className="w-5 h-5" />
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEdit(w)}
                              className="p-1.5 rounded-md hover:bg-on-surface/10 text-on-surface-variant hover:text-on-surface"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setPendingDelete(isPending ? null : w.id)}
                              className={cn(
                                'p-1.5 rounded-md hover:bg-error/20 text-on-surface-variant hover:text-error',
                                isPending && 'bg-error/20 text-error'
                              )}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="mb-4">
                          <h4 className="font-bold text-on-surface truncate">{w.name}</h4>
                          <p className="text-xs text-on-surface-variant line-clamp-1">{w.description || t('noDescription', language)}</p>
                        </div>

                        {isPending ? (
                          <div className="mt-2 p-2 rounded-lg bg-error/10 border border-error/20 flex flex-col gap-2">
                            <p className="text-[10px] text-error">{t('deleteWorkspaceConfirm', language)}</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setPendingDelete(null)}
                                className="flex-1 py-1 text-[10px] rounded hover:bg-on-surface/10 text-on-surface-variant"
                              >
                                {t('cancel', language)}
                              </button>
                              <button
                                onClick={() => handleDelete(w.id)}
                                disabled={busy}
                                className="flex-1 py-1 text-[10px] rounded bg-error/80 hover:bg-error text-background font-medium"
                              >
                                {t('delete', language)}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSwitch(w.id)}
                            disabled={isActive || busy}
                            className={cn(
                              'w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all',
                              isActive
                                ? 'bg-success/20 text-success cursor-default'
                                : 'bg-on-surface/10 text-on-surface hover:bg-primary hover:text-background'
                            )}
                          >
                            {isActive ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                {t('active', language)}
                              </>
                            ) : (
                              <>
                                <MousePointer2 className="w-3.5 h-3.5" />
                                {t('switchTo', language)}
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
