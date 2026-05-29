// @ts-nocheck
import { Router, Response } from 'express';
import { z } from 'zod';
import argon2 from 'argon2';
import prisma from '../../shared/services/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../../shared/middleware/auth';
import { createAuditLog, getRequestIp, getRequestUserAgent } from '../../shared/services/audit';
import { revokeAllUserSessions } from '../../shared/services/tokens';

const router = Router();

router.use(authenticate, requireAdmin);

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().optional(),
  role: z.enum(['user', 'admin']).default('user'),
});

router.post('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name, role } = createUserSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const passwordHash = await argon2.hash(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || email.split('@')[0],
        role,
        provider: 'local',
        emailVerified: true, // Admin created users are verified
      },
    });

    await createAuditLog({
      actorUserId: req.user.id,
      actorEmail: req.user.email,
      action: 'admin_user_created',
      entityType: 'User',
      entityId: user.id,
      ipAddress: getRequestIp(req),
      userAgent: getRequestUserAgent(req),
      metadata: { createdEmail: email, role }
    });

    const { passwordHash: _, ...safeUser } = user;
    res.status(201).json(safeUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.format() });
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.get('/users', async (req: AuthRequest, res: Response) => {
  const { search, role, isActive, provider, deleted } = req.query;
  
  const where: any = {};
  
  if (search) {
    where.OR = [
      { email: { contains: String(search) } },
      { name: { contains: String(search) } }
    ];
  }
  
  if (role) where.role = String(role);
  if (isActive !== undefined) where.isActive = isActive === 'true';
  if (provider) where.provider = String(provider);
  
  if (deleted === 'true') {
    where.deletedAt = { not: null };
  } else if (deleted === 'false') {
    where.deletedAt = null;
  }

  try {
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        isActive: true,
        provider: true,
        emailVerified: true,
        lastLoginAt: true,
        lastLoginIp: true,
        deletedAt: true,
        createdAt: true,
        tokenVersion: true,
        storageQuotaBytes: true,
        usedStorageBytes: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.patch('/users/:id', async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { role, isActive, storageQuotaBytes } = req.body;
  
  try {
    const currentUser = await prisma.user.findUnique({ where: { id } });
    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    // Prevent removing the last admin
    if (currentUser.role === 'admin' && role === 'user') {
      const adminCount = await prisma.user.count({ where: { role: 'admin', isActive: true, deletedAt: null } });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot remove the last active admin' });
      }
    }

    const data: any = {};
    if (role !== undefined) data.role = role;
    if (isActive !== undefined) data.isActive = isActive;
    if (storageQuotaBytes !== undefined) data.storageQuotaBytes = BigInt(storageQuotaBytes);

    // If role or isActive changes, increment tokenVersion to revoke old tokens
    if ((role !== undefined && role !== currentUser.role) || (isActive !== undefined && isActive !== currentUser.isActive)) {
      data.tokenVersion = { increment: 1 };
      await revokeAllUserSessions(id);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        tokenVersion: true
      }
    });

    await createAuditLog({
      actorUserId: req.user.id,
      actorEmail: req.user.email,
      action: 'admin_user_updated',
      entityType: 'User',
      entityId: id,
      ipAddress: getRequestIp(req),
      userAgent: getRequestUserAgent(req),
      metadata: { updates: req.body }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Update failed' });
  }
});

router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Prevent deleting self
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    await prisma.user.update({
      where: { id },
      data: { 
        deletedAt: new Date(),
        isActive: false,
        tokenVersion: { increment: 1 }
      }
    });

    await revokeAllUserSessions(id);

    await createAuditLog({
      actorUserId: req.user.id,
      actorEmail: req.user.email,
      action: 'admin_user_soft_deleted',
      entityType: 'User',
      entityId: id,
      ipAddress: getRequestIp(req),
      userAgent: getRequestUserAgent(req)
    });

    res.json({ message: 'User soft-deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

router.post('/users/:id/purge', async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { confirmation } = req.body;

  if (confirmation !== 'ELIMINAR DATOS') {
    return res.status(400).json({ error: 'Missing or incorrect confirmation string' });
  }

  try {
    // Transactional purge
    await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId: id } }),
      // Workspaces relation with User uses onDelete: Restrict by default if not specified, 
      // but let's clear them. Better would be Cascade in schema.
      // For now let's just clear user's workspaces
      prisma.workspace.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } })
    ]);

    await createAuditLog({
      actorUserId: req.user.id,
      actorEmail: req.user.email,
      action: 'admin_user_data_purged',
      entityType: 'User',
      entityId: id,
      ipAddress: getRequestIp(req),
      userAgent: getRequestUserAgent(req)
    });

    res.json({ message: 'User and all data purged' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Purge failed' });
  }
});

router.get('/audit-logs', async (req: AuthRequest, res: Response) => {
  const { action, actorUserId, severity, page = 1, limit = 50 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  
  const where: any = {};
  if (action) where.action = String(action);
  if (actorUserId) where.actorUserId = String(actorUserId);
  if (severity) where.severity = String(severity);

  try {
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip,
      include: {
        user: {
          select: { email: true, name: true }
        }
      }
    });
    const total = await prisma.auditLog.count({ where });
    res.json({ logs, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

router.get('/users/:id/storage', async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  try {
    const user = await prisma.user.findUnique({ where: { id }, select: { email: true } });
    
    const workspacesCount = await prisma.workspace.count({ where: { userId: id, deletedAt: null } });
    const deletedWorkspacesCount = await prisma.workspace.count({ where: { userId: id, NOT: { deletedAt: null } } });
    
    // Notes, Snippets, Groups are linked to Workspaces
    const userWorkspaces = await prisma.workspace.findMany({ where: { userId: id }, select: { id: true } });
    const workspaceIds = userWorkspaces.map(w => w.id);

    const notesCount = await prisma.note.count({ where: { workspaceId: { in: workspaceIds }, deletedAt: null } });
    const deletedNotesCount = await prisma.note.count({ where: { workspaceId: { in: workspaceIds }, NOT: { deletedAt: null } } });
    
    const snippetsCount = await prisma.snippet.count({ where: { workspaceId: { in: workspaceIds }, deletedAt: null } });
    const deletedSnippetsCount = await prisma.snippet.count({ where: { workspaceId: { in: workspaceIds }, NOT: { deletedAt: null } } });
    
    const groupsCount = await prisma.group.count({ where: { workspaceId: { in: workspaceIds }, deletedAt: null } });
    const connectionsCount = await prisma.connection.count({ where: { workspaceId: { in: workspaceIds }, deletedAt: null } });

    // Approximate size calculation
    const allNotes = await prisma.note.findMany({ where: { workspaceId: { in: workspaceIds } }, select: { content: true } });
    const allSnippets = await prisma.snippet.findMany({ where: { workspaceId: { in: workspaceIds } }, select: { code: true } });
    
    let estimatedSize = 0;
    allNotes.forEach(n => estimatedSize += (n.content || '').length);
    allSnippets.forEach(s => estimatedSize += (s.code || '').length);

    console.log(`[ADMIN STORAGE] Consulted user: ${user?.email} (${id}) - Workspaces: ${workspacesCount}, Notes: ${notesCount}, Snippets: ${snippetsCount}, Connections: ${connectionsCount}`);

    res.json({
      userEmail: user?.email,
      workspaces: workspacesCount,
      deletedWorkspaces: deletedWorkspacesCount,
      notes: notesCount,
      deletedNotes: deletedNotesCount,
      snippets: snippetsCount,
      deletedSnippets: deletedSnippetsCount,
      groups: groupsCount,
      connections: connectionsCount,
      estimatedSize
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch storage info' });
  }
});

router.get('/users/:id/sessions', async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: id, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

router.delete('/users/:id/sessions', async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  try {
    await revokeAllUserSessions(id);
    await createAuditLog({
      actorUserId: req.user.id,
      actorEmail: req.user.email,
      action: 'admin_all_sessions_revoked',
      entityType: 'User',
      entityId: id,
      ipAddress: getRequestIp(req),
      userAgent: getRequestUserAgent(req)
    });
    res.json({ message: 'All sessions revoked' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to revoke sessions' });
  }
});

export default router;
