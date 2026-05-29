import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Response, Request } from 'express';
import prisma from './prisma';
import { getRequestIp, getRequestUserAgent, createAuditLog } from './audit';

const ACCESS_TOKEN_TTL = '1h';
const REFRESH_TOKEN_TTL_DAYS = 30;

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

if (!JWT_SECRET || !REFRESH_TOKEN_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET and REFRESH_TOKEN_SECRET must be set in production');
  } else {
    console.warn('WARNING: JWT_SECRET or REFRESH_TOKEN_SECRET not set. Using insecure defaults for development.');
  }
}

const SECRETS = {
  jwt: JWT_SECRET || 'dev_jwt_secret_donotuseinprod',
  refresh: REFRESH_TOKEN_SECRET || 'dev_refresh_secret_donotuseinprod'
};

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  tokenVersion: number;
}

export function signAccessToken(user: TokenPayload) {
  return jwt.sign(
    { 
      sub: user.id, 
      email: user.email, 
      role: user.role, 
      tokenVersion: user.tokenVersion 
    },
    SECRETS.jwt,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

export function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

export function hashRefreshToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createSessionForUser(userId: string, req: Request) {
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const tokenFamily = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

  const session = await prisma.session.create({
    data: {
      userId,
      refreshTokenHash,
      tokenFamily,
      userAgent: getRequestUserAgent(req),
      ipAddress: getRequestIp(req),
      expiresAt,
    },
  });

  return { refreshToken, session };
}

export async function rotateRefreshToken(oldRefreshToken: string, req: Request) {
  const oldHash = hashRefreshToken(oldRefreshToken);
  
  const session = await prisma.session.findUnique({
    where: { refreshTokenHash: oldHash },
    include: { user: true }
  });

  if (!session) {
    throw new Error('Invalid refresh token');
  }

  // Check if session has expired
  if (session.expiresAt < new Date()) {
    throw new Error('Refresh token expired');
  }

  // Detection of token reuse (potential theft)
  if (session.revokedAt || session.replacedByTokenId) {
    // Revoke all sessions in the family
    await prisma.session.updateMany({
      where: { tokenFamily: session.tokenFamily },
      data: { revokedAt: new Date() }
    });

    await createAuditLog({
      actorUserId: session.userId,
      action: 'refresh_token_reuse_detected',
      severity: 'critical',
      ipAddress: getRequestIp(req),
      userAgent: getRequestUserAgent(req),
      metadata: { tokenFamily: session.tokenFamily }
    });

    throw new Error('Security breach detected. All sessions revoked.');
  }

  // Rotate token
  const newRefreshToken = generateRefreshToken();
  const newHash = hashRefreshToken(newRefreshToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

  const newSession = await prisma.session.create({
    data: {
      userId: session.userId,
      refreshTokenHash: newHash,
      tokenFamily: session.tokenFamily,
      userAgent: getRequestUserAgent(req),
      ipAddress: getRequestIp(req),
      expiresAt,
      lastUsedAt: new Date(),
    },
  });

  await prisma.session.update({
    where: { id: session.id },
    data: { 
      replacedByTokenId: newSession.id,
      revokedAt: new Date(),
      lastUsedAt: new Date(),
    }
  });

  return { 
    newRefreshToken, 
    user: session.user,
    accessToken: signAccessToken({
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      tokenVersion: session.user.tokenVersion
    })
  };
}

export async function revokeSession(sessionId: string, userId?: string) {
  await prisma.session.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() }
  });
}

export async function revokeAllUserSessions(userId: string) {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() }
  });
}

export function verifyAccessToken(token: string): any {
  return jwt.verify(token, SECRETS.jwt);
}

// Cookie Helpers
export function setRefreshTokenCookie(res: Response, token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    path: '/', // Root path to allow access from any API subroute
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
  });
}

export function clearRefreshTokenCookie(res: Response) {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    path: '/'
  });
}
