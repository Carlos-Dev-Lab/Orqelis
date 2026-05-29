import { Request, Response, NextFunction } from 'express';
import { getSystemStatus } from '../services/setup';

export const ensureConfigured = async (req: Request, res: Response, next: NextFunction) => {
  // Skip check for setup routes to avoid infinite loop
  if (req.path.startsWith('/setup')) {
    return next();
  }

  try {
    const status = await getSystemStatus();
    
    if (!status.ready || !status.configured) {
      return res.status(503).json({ 
        error: status.configured ? 'System temporarily unavailable' : 'System not configured', 
        needsSetup: !status.configured,
        ready: status.ready,
        database: status.database,
        details: status.details
      });
    }
    
    next();
  } catch (error) {
    console.error('[Setup Check Middleware]: Error checking configuration:', error);
    res.status(500).json({ error: 'Internal server error during setup check' });
  }
};
