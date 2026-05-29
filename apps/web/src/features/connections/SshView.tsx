import { Server } from 'lucide-react';
import { useAppStore } from '@/shared/store';
import { t } from '@/shared/i18n';

/**
 * SshView — Temporalmente deshabilitado.
 * La funcionalidad de conexiones SSH/Web fue migrada a ConnectionsView
 * y se gestiona a través del backend REST API.
 * Este componente existía sobre tipos (SshConnection, SshCredential) que no están
 * definidos en la codebase actual. La funcionalidad completa se reintegrará
 * en una versión futura a través de /connections.
 */
export function SshView() {
  const { language } = useAppStore();

  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 text-on-surface-variant">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Server className="w-8 h-8 text-primary/50" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-bold text-on-surface mb-1">
          {t('connections', language)}
        </h2>
        <p className="text-sm opacity-60">
          {language === 'es'
            ? 'Esta funcionalidad está disponible en la sección Conexiones.'
            : 'This functionality is available in the Connections section.'}
        </p>
      </div>
    </div>
  );
}
