import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, Plus, X, Trash2, Edit3, Check, FolderOpen } from 'lucide-react';
import { useAppStore } from '@/shared/store';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/utils';
import type { Group } from '@orqelis/shared';

const COLOR_PALETTE = [
  '#22d3ee', '#a78bfa', '#f472b6', '#fb7185', '#fb923c',
  '#facc15', '#4ade80', '#34d399', '#60a5fa', '#818cf8',
];

interface GroupManagerProps {
  open: boolean;
  onClose: () => void;
}

type FormState = {
  id: string | null;
  name: string;
  description: string;
  color: string;
};

const emptyForm: FormState = {
  id: null,
  name: '',
  description: '',
  color: COLOR_PALETTE[0],
};

export function GroupManager({ open, onClose }: GroupManagerProps) {
  const { groups, notes, createGroup, updateGroup, deleteGroup, language, addNotification } = useAppStore() as any;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(emptyForm);
      setPendingDelete(null);
    }
  }, [open]);

  const countByGroup = useMemo(() => {
    const map = new Map<string, number>();
    notes.forEach((n) => {
      if (n.groupId) map.set(n.groupId, (map.get(n.groupId) ?? 0) + 1);
    });
    return map;
  }, [notes]);

  const isEditing = form.id !== null;
  const isDirty = useMemo(() => {
    // consider empty description and default color as not dirty
    return (
      (form.name.trim().length > 0) ||
      (form.description.trim().length > 0) ||
      (form.color !== emptyForm.color) ||
      isEditing
    );
  }, [form, isEditing]);

  const guardClose = () => {
    if (busy) return; // no cerrar mientras hay operación
    if (!form.name.trim() && isDirty) {
      // Avisar al usuario que faltan campos obligatorios
      if (typeof addNotification === 'function') {
        addNotification({
          title: t('requiredFields', language) ?? 'Complete los campos obligatorios',
          message: t('groupNameRequired', language) ?? 'El título del grupo es obligatorio.',
          type: 'warning',
        });
      } else {
        // fallback simple
        alert(t('groupNameRequired', language) ?? 'El título del grupo es obligatorio.');
      }
      return;
    }
    onClose();
  };

  const startEdit = (group: Group) => {
    setForm({
      id: group.id,
      name: group.name,
      description: group.description,
      color: group.color,
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
        await updateGroup(form.id, {
          name: form.name.trim(),
          description: form.description.trim(),
          color: form.color,
        });
      } else {
        await createGroup({
          name: form.name.trim(),
          description: form.description.trim(),
          color: form.color,
        });
      }
      resetForm();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    setBusy(true);
    try {
      await deleteGroup(id);
      if (form.id === id) resetForm();
      setPendingDelete(null);
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
          onClick={guardClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-3xl max-h-[90vh] bg-surface-container-lowest border border-on-surface/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 flex items-center gap-3 border-b border-on-surface/10">
              <div className="w-9 h-9 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-on-surface">{t('manageGroups', language)}</h2>
                <p className="text-xs text-on-surface-variant">
                  {t('manageGroupsSub', language)}
                </p>
              </div>
              <button
                onClick={guardClose}
                className="p-2 rounded-lg hover:bg-on-surface/10 text-on-surface-variant"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 grid md:grid-cols-2 gap-0 overflow-hidden">
              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="p-5 border-b md:border-b-0 md:border-r border-on-surface/10 space-y-4 overflow-y-auto custom-scrollbar"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-on-surface">
                    {isEditing ? t('editGroup', language) : t('newGroup', language)}
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
                    placeholder={t('groupNamePlaceholder', language)}
                    className="w-full px-3 py-2 rounded-lg bg-on-surface/5 border border-on-surface/10 focus:border-primary/50 outline-none text-sm text-on-surface placeholder:text-on-surface-variant/40"
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-on-surface-variant">{t('description', language)}</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder={t('optional', language)}
                    rows={3}
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
                          'w-7 h-7 rounded-full border-2 transition-all',
                          form.color === c
                            ? 'border-on-surface scale-110'
                            : 'border-transparent hover:scale-105'
                        )}
                        style={{ backgroundColor: c }}
                        aria-label={`Color ${c}`}
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
                  {isEditing ? t('saveChanges', language) : t('createGroup', language)}
                </button>
              </form>

              {/* List */}
              <div className="p-5 overflow-y-auto custom-scrollbar max-h-[60vh] md:max-h-none">
                <h3 className="text-sm font-semibold text-on-surface mb-3">
                  {t('allGroupsList', language)} <span className="text-on-surface-variant/60 font-normal">({groups.length})</span>
                </h3>

                {groups.length === 0 ? (
                  <div className="py-8 text-center text-on-surface-variant/60">
                    <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">{t('noGroupsYet', language)}</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {groups.map((g) => {
                      const isPending = pendingDelete === g.id;
                      const isSelected = form.id === g.id;
                      return (
                        <li
                          key={g.id}
                          className={cn(
                            'p-3 rounded-lg border transition-all',
                            isSelected
                              ? 'border-primary/40 bg-primary/5'
                              : 'border-on-surface/10 hover:border-on-surface/20 bg-on-surface/5'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 mt-1"
                              style={{ backgroundColor: g.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-on-surface truncate">
                                {g.name}
                              </p>
                              {g.description && (
                                <p className="text-xs text-on-surface-variant line-clamp-2">
                                  {g.description}
                                </p>
                              )}
                              <p className="text-[10px] font-mono text-on-surface-variant/60 mt-1">
                                {countByGroup.get(g.id) ?? 0} {t('notes', language).toLowerCase()}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => startEdit(g)}
                                className="p-1.5 rounded-md hover:bg-on-surface/10 text-on-surface-variant hover:text-on-surface"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setPendingDelete(isPending ? null : g.id)}
                                className={cn(
                                  'p-1.5 rounded-md hover:bg-error/20 text-on-surface-variant hover:text-error',
                                  isPending && 'bg-error/20 text-error'
                                )}
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {isPending && (
                            <div className="mt-3 p-2 rounded-md bg-error/10 border border-error/20 flex items-center gap-2">
                              <p className="flex-1 text-xs text-error">
                                {t('deleteGroupConfirm', language)}
                              </p>
                              <button
                                onClick={() => setPendingDelete(null)}
                                className="px-2 py-1 text-xs rounded hover:bg-on-surface/10 text-on-surface-variant"
                              >
                                {t('cancel', language)}
                              </button>
                              <button
                                onClick={() => handleDelete(g.id)}
                                disabled={busy}
                                className="px-2 py-1 text-xs rounded bg-error/80 hover:bg-error text-background font-medium"
                              >
                                {t('confirm', language)}
                              </button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
