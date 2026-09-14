import { Request, Response, NextFunction, RequestHandler } from 'express';
import prisma from '../services/prisma';
import { verifyAccessToken } from '../services/tokens';
import { createAuditLog, getRequestIp, getRequestUserAgent } from '../services/audit';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  tokenVersion: number;
}

export interface AuthRequest extends Request {
  user: AuthUser;
}

export const authenticate: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = verifyAccessToken(token);
    
    // Use 'sub' as per signAccessToken implementation
    const userId = decoded.sub || decoded.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user || user.deletedAt) {
      return res.status(401).json({ error: 'User not found or account deleted' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account disabled' });
    }

    // Security check: tokenVersion must match
    if (user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({ error: 'Token expired due to security changes' });
    }

    const { passwordHash: _, ...safeUser } = user;
    (req as any).user = safeUser as AuthUser;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin: RequestHandler = async (req, res, next) => {
  const user = (req as any).user as AuthUser;
  if (user?.role !== 'admin') {
    await createAuditLog({
      actorUserId: user?.id,
      actorEmail: user?.email,
      action: 'admin_access_denied',
      status: 'failure',
      severity: 'warning',
      ipAddress: getRequestIp(req),
      userAgent: getRequestUserAgent(req),
      metadata: { path: req.path }
    });
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const authorizeAdmin = requireAdmin; // For compatibility

export const requireWorkspace: RequestHandler = async (req, res, next) => {
  const user = (req as any).user as AuthUser;
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const workspaceCount = await prisma.workspace.count({
    where: { userId: user.id, deletedAt: null },
  });

  if (workspaceCount === 0) {
    return res.status(403).json({ 
      error: 'Workspace required', 
      message: 'You must create at least one workspace before performing this action.' 
    });
  }

  next();
};
