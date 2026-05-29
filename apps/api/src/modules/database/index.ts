// @ts-nocheck
import { Router } from 'express';
import { z } from 'zod';
import { updatePrismaConfig } from '../../shared/services/prisma';
import { authenticate, authorizeAdmin } from '../../shared/middleware/auth';
import { createAuditLog, getRequestIp, getRequestUserAgent } from '../../shared/services/audit';

const router = Router();

const dbConfigSchema = z.object({
  provider: z.enum(['sqlite', 'postgresql', 'mysql', 'sqlserver']),
  url: z.string().url().or(z.string().startsWith('file:')),
});

function maskUrl(url: string | undefined): string {
  if (!url) return '';
  // Simple masking for sensitive parts of the URL
  return url.replace(/(:[^:@]+)@/, ':********@');
}

// Get current DB config (simplified)
router.get('/config', authenticate, authorizeAdmin, (req, res) => {
  res.json({
    provider: process.env.DB_PROVIDER || 'sqlite',
    url: maskUrl(process.env.DATABASE_URL)
  });
});

// Update DB config
router.post('/config', authenticate, authorizeAdmin, async (req, res) => {
  // Security check for production
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DB_RECONFIGURATION !== 'true') {
    return res.status(403).json({ error: 'Database reconfiguration is disabled in production' });
  }

  try {
    const { provider, url } = dbConfigSchema.parse(req.body);
    
    await createAuditLog({
      actorUserId: (req as any).user?.id,
      actorEmail: (req as any).user?.email,
      action: 'db_config_update',
      entityType: 'System',
      ipAddress: getRequestIp(req),
      userAgent: getRequestUserAgent(req),
      metadata: { provider, url: maskUrl(url) }
    });

    updatePrismaConfig({ provider, url });
    res.json({ message: 'Database configuration updated. Re-initialization may be required.' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    console.error('DB Config update error:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

export default router;
