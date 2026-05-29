// @ts-nocheck
import { Router, Request, Response } from 'express';
import { AuthUser, authenticate } from '../../shared/middleware/auth';
import prisma from '../../shared/services/prisma';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

// GET / — List workspaces for authenticated user
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as AuthUser;
    const userId = user.id;

    const workspaces = await prisma.workspace.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workspaces' });
  }
});

// GET /:id — Get a single workspace
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as AuthUser;
    const userId = user.id;
    const { id } = req.params;

    const workspace = await prisma.workspace.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    res.json(workspace);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workspace' });
  }
});

// POST / — Create workspace
const createWorkspaceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string(),
  icon: z.string(),
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as AuthUser;
    const userId = user.id;

    const parsed = createWorkspaceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const { id, name, description, color, icon } = parsed.data;

    const workspace = await prisma.workspace.create({
      data: {
        ...(id ? { id } : {}),
        name,
        description,
        color,
        icon,
        userId,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    res.status(201).json(workspace);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create workspace' });
  }
});

// PATCH /:id — Update workspace
const updateWorkspaceSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as AuthUser;
    const userId = user.id;
    const { id } = req.params;

    const existing = await prisma.workspace.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!existing) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    const parsed = updateWorkspaceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const workspace = await prisma.workspace.update({
      where: { id },
      data: {
        ...parsed.data,
        updatedAt: new Date(),
      },
    });

    res.json(workspace);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update workspace' });
  }
});

// DELETE /:id — Soft-delete workspace
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as AuthUser;
    const userId = user.id;
    const { id } = req.params;

    const existing = await prisma.workspace.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!existing) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    await prisma.workspace.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json({ message: 'Workspace deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete workspace' });
  }
});

// PATCH /:id/activate — Mark workspace as active
router.patch('/:id/activate', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as AuthUser;
    const userId = user.id;
    const { id } = req.params;

    const existing = await prisma.workspace.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!existing) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    const workspace = await prisma.$transaction(async (tx) => {
      await tx.workspace.updateMany({
        where: { userId },
        data: { isActive: false },
      });

      return tx.workspace.update({
        where: { id },
        data: { isActive: true },
      });
    });

    res.json(workspace);
  } catch (error) {
    res.status(500).json({ error: 'Failed to activate workspace' });
  }
});

export default router;
