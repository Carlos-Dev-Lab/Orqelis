import { Router, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import argon2 from 'argon2';
import { z } from 'zod';
import crypto from 'crypto';
import { rateLimit } from 'express-rate-limit';
import prisma from '../../shared/services/prisma';
import { authenticate, AuthRequest } from '../../shared/middleware/auth';
import { 
  signAccessToken, 
  createSessionForUser, 
  setRefreshTokenCookie, 
  clearRefreshTokenCookie, 
  rotateRefreshToken,
} from '../../shared/services/tokens';
import { createAuditLog, getRequestIp, getRequestUserAgent } from '../../shared/services/audit';

const router = Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per window
  message: { error: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});


router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    const genericError = 'Invalid credentials';

    if (!user || user.deletedAt) {
      // Still verify argon2 to prevent timing attacks, but with a dummy hash
      await argon2.verify('$argon2id$v=19$m=65536,t=3,p=4$66V6o6o6o6o6o6o6o6o6o6g$o6o6o6o6o6o6o6o6o6o6o6o6o6o6o6o6o6o6o6o6o6o', password);
      
      await createAuditLog({
        actorEmail: email,
        action: 'login_failed',
        status: 'failure',
        severity: 'warning',
        ipAddress: getRequestIp(req),
        userAgent: getRequestUserAgent(req),
        metadata: { reason: 'user_not_found_or_deleted' }
      });
      return res.status(401).json({ error: genericError });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account disabled' });
    }

    let isMatch = false;
    if (user.passwordHash) {
      isMatch = await argon2.verify(user.passwordHash, password);
    }

    if (!isMatch) {
      await createAuditLog({
        actorUserId: user.id,
        actorEmail: user.email,
        action: 'login_failed',
        status: 'failure',
        severity: 'warning',
        ipAddress: getRequestIp(req),
        userAgent: getRequestUserAgent(req),
        metadata: { reason: 'invalid_password' }
      });
      return res.status(401).json({ error: genericError });
    }

    const { refreshToken } = await createSessionForUser(user.id, req);
    const accessToken = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: getRequestIp(req)
      }
    });

    setRefreshTokenCookie(res, refreshToken);

    await createAuditLog({
      actorUserId: user.id,
      actorEmail: user.email,
      action: 'login_success',
      ipAddress: getRequestIp(req),
      userAgent: getRequestUserAgent(req)
    });

    const { passwordHash, ...safeUser } = user;
    res.json({ user: safeUser, accessToken });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input' });
    }
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});


router.post('/google', loginLimiter, async (req: Request, res: Response) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Credential is required' });
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    console.error('GOOGLE_CLIENT_ID is not configured');
    return res.status(501).json({ error: 'Google authentication not configured' });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    
    if (!payload || !payload.email || !payload.email_verified) {
      return res.status(400).json({ error: 'Invalid or unverified Google account' });
    }

    // Check allowed domains
    if (process.env.ALLOWED_GOOGLE_DOMAINS) {
      const allowedDomains = process.env.ALLOWED_GOOGLE_DOMAINS.split(',').map(d => d.trim().toLowerCase());
      const userDomain = payload.email.split('@')[1].toLowerCase();
      if (!allowedDomains.includes(userDomain)) {
        return res.status(403).json({ error: 'Email domain not authorized' });
      }
    }

    let user = await prisma.user.findUnique({
      where: { googleId: payload.sub },
    });

    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: payload.email },
      });
      
      if (user) {
        // Link google account to existing email
        user = await prisma.user.update({
          where: { id: user.id },
          data: { 
            googleId: payload.sub,
            image: user.image || payload.picture,
            emailVerified: true
          }
        });
        await createAuditLog({
          actorUserId: user.id,
          actorEmail: user.email,
          action: 'google_account_linked',
          ipAddress: getRequestIp(req),
          userAgent: getRequestUserAgent(req)
        });
      } else {
        // Registration check
        if (process.env.ALLOW_PUBLIC_REGISTRATION !== 'true') {
          return res.status(403).json({ error: 'Public registration is disabled' });
        }

        // Create new user
        const userCount = await prisma.user.count();
        
        user = await prisma.user.create({
          data: {
            email: payload.email,
            name: payload.name || payload.email.split('@')[0],
            image: payload.picture,
            googleId: payload.sub,
            emailVerified: true,
            provider: 'google',
            role: userCount === 0 ? 'admin' : 'user',
          },
        });
        await createAuditLog({
          actorUserId: user.id,
          actorEmail: user.email,
          action: 'google_register_success',
          ipAddress: getRequestIp(req),
          userAgent: getRequestUserAgent(req)
        });
      }
    }

    if (!user.isActive || user.deletedAt) {
      return res.status(403).json({ error: 'Account disabled or deleted' });
    }

    const { refreshToken } = await createSessionForUser(user.id, req);
    const accessToken = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: getRequestIp(req)
      }
    });

    setRefreshTokenCookie(res, refreshToken);

    await createAuditLog({
      actorUserId: user.id,
      actorEmail: user.email,
      action: 'google_login_success',
      ipAddress: getRequestIp(req),
      userAgent: getRequestUserAgent(req)
    });

    const { passwordHash: _, ...safeUser } = user;
    res.json({ user: safeUser, accessToken });
  } catch (error) {
    console.error('Google Auth Error:', error);
    const message = process.env.NODE_ENV === 'production' ? 'Authentication failed' : String(error);
    await createAuditLog({
      action: 'google_login_failed',
      status: 'failure',
      severity: 'error',
      ipAddress: getRequestIp(req),
      userAgent: getRequestUserAgent(req),
      metadata: { error: message }
    });
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

router.all('/refresh', async (req: Request, res: Response) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const oldRefreshToken = req.cookies.refreshToken;

  if (!oldRefreshToken) {
    return res.status(401).json({ error: 'Refresh token missing' });
  }

  try {
    const { newRefreshToken, accessToken, user } = await rotateRefreshToken(oldRefreshToken, req);
    
    setRefreshTokenCookie(res, newRefreshToken);
    
    await createAuditLog({
      actorUserId: user.id,
      actorEmail: user.email,
      action: 'refresh_success',
      ipAddress: getRequestIp(req),
      userAgent: getRequestUserAgent(req)
    });

    const { passwordHash, ...safeUser } = user;
    res.json({ accessToken, user: safeUser });
  } catch (error) {
    clearRefreshTokenCookie(res);
    await createAuditLog({
      action: 'refresh_failed',
      status: 'failure',
      severity: 'warning',
      ipAddress: getRequestIp(req),
      userAgent: getRequestUserAgent(req),
      metadata: { error: String(error) }
    });
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  
  if (refreshToken) {
    try {
      const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const session = await prisma.session.findUnique({ where: { refreshTokenHash: hash } });
      if (session) {
        await prisma.session.update({
          where: { id: session.id },
          data: { revokedAt: new Date() }
        });
        await createAuditLog({
          actorUserId: session.userId,
          action: 'logout',
          ipAddress: getRequestIp(req),
          userAgent: getRequestUserAgent(req)
        });
      }
    } catch (e) {
      // Ignore errors on logout
    }
  }

  clearRefreshTokenCookie(res);
  res.json({ message: 'Logged out successfully' });
});

router.get('/sessions', authenticate, (async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { 
        userId: req.user.id,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
}) as any);

router.delete('/sessions/:id', authenticate, (async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  try {
    const session = await prisma.session.findUnique({ where: { id } });
    
    if (!session || session.userId !== req.user.id) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await prisma.session.update({
      where: { id },
      data: { revokedAt: new Date() }
    });

    await createAuditLog({
      actorUserId: req.user.id,
      action: 'session_revoked',
      entityType: 'Session',
      entityId: id,
      ipAddress: getRequestIp(req),
      userAgent: getRequestUserAgent(req)
    });

    res.json({ message: 'Session revoked' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to revoke session' });
  }
}) as any);

router.get('/me', authenticate, (async (req: AuthRequest, res: Response) => {
  res.json(req.user);
}) as any);

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  image: z.string().url().optional().or(z.literal('')),
});

router.patch('/me', authenticate, (async (req: AuthRequest, res: Response) => {
  try {
    const updates = updateProfileSchema.parse(req.body);
    
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updates,
    });

    await createAuditLog({
      actorUserId: req.user.id,
      actorEmail: req.user.email,
      action: 'profile_updated',
      entityType: 'User',
      entityId: req.user.id,
      ipAddress: getRequestIp(req),
      userAgent: getRequestUserAgent(req),
      metadata: { updates: Object.keys(updates) }
    });

    const { passwordHash, ...safeUser } = updatedUser;
    res.json(safeUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input' });
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}) as any);

export default router;
