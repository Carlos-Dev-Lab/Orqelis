// @ts-nocheck
import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../shared/middleware/auth';
import prisma from '../../shared/services/prisma';

const router = Router();

router.use(authenticate);

// GET / — Lista notificaciones del usuario
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST / — Crear notificación
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { id, title, message, type, link, workspaceId } = req.body;

    const notification = await prisma.notification.create({
      data: {
        ...(id ? { id } : {}),
        title,
        message,
        type,
        link,
        workspaceId,
        userId: req.user!.id,
        read: false,
        timestamp: new Date(),
      },
    });
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /read-all — Marcar todas como leídas (debe ir antes de /:id/read)
router.patch('/read-all', async (req: AuthRequest, res: Response) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user!.id, read: false },
      data: { read: true },
    });
    res.json({ updated: result.count });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /:id/read — Marcar como leída
router.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.notification.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE / — Limpiar todas las notificaciones del usuario
router.delete('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await prisma.notification.deleteMany({
      where: { userId: req.user!.id },
    });
    res.json({ deleted: result.count });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /:id — Eliminar notificación
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.notification.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await prisma.notification.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
