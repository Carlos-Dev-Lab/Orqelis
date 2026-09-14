import { Request } from 'express';
import prisma from './prisma';

export interface AuditLogParams {
  actorUserId?: string;
  actorEmail?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  status?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

export async function createAuditLog(params: AuditLogParams) {
  try {
    const {
      actorUserId,
      actorEmail,
      action,
      entityType,
      entityId,
      status = 'success',
      severity = 'info',
      ipAddress,
      userAgent,
      metadata = {},
    } = params;

    await prisma.auditLog.create({
      data: {
        actorUserId,
        actorEmail,
        action,
        entityType,
        entityId,
        status,
        severity,
        ipAddress,
        userAgent,
        metadata: JSON.stringify(metadata),
      },
    });
  } catch (error) {
    // We catch errors internally so an audit failure doesn't break the main request
    console.error('Failed to create audit log:', error);
  }
}

export function getRequestIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket.remoteAddress;
  return ip || 'unknown';
}

export function getRequestUserAgent(req: Request): string {
  return req.headers['user-agent'] || 'unknown';
}
