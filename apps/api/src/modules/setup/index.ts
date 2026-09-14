import { Router, Request, Response } from 'express';
import { isConfigured, setupSystem, DBConfig, AdminConfig, getSystemStatus } from '../../shared/services/setup';
import { z } from 'zod';

const router = Router();

const setupSchema = z.object({
  dbConfig: z.object({
    type: z.enum(['sqlite']),
    host: z.string().optional(),
    port: z.number().optional(),
    database: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    filename: z.string().optional(),
  }),
  adminConfig: z.object({
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string()
      .min(12)
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
  }),
});

router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await getSystemStatus(req.query.refresh === 'true');
    res.json(status);
  } catch (error) {
    console.error('[Setup Route]: Failed to check status:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  // 1. Security check for production
  if (process.env.NODE_ENV === 'production') {
    const setupToken = process.env.SETUP_TOKEN;
    const clientToken = req.headers['x-setup-token'];

    if (!setupToken) {
      console.error('[Setup]: SETUP_TOKEN is not defined in production environment.');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    if (!clientToken || clientToken !== setupToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  // 2. Check if already configured to prevent re-setup
  const configured = await isConfigured();
  if (configured) {
    return res.status(403).json({ 
      error: 'ALREADY_CONFIGURED', 
      message: 'The system is already configured. If you need to reconfigure, please contact the administrator.' 
    });
  }

  try {
    const data = setupSchema.parse(req.body);
    await setupSystem(data.dbConfig as DBConfig, data.adminConfig as AdminConfig);
    res.json({ success: true, message: 'System configured successfully. Please restart the application.' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    
    console.error('Setup error:', error);
    const message = process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : (error.message || 'Failed to configure system');
      
    res.status(500).json({ error: message });
  }
});

export default router;
