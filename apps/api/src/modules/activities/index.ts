// @ts-nocheck
import { Router, Request, Response } from 'express';
import { AuthUser, authenticate } from '../../shared/middleware/auth';
import prisma from '../../shared/services/prisma';

const router = Router();

router.use(authenticate);

// GET / — Lista actividades del usuario
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as AuthUser;
    const activities = await prisma.activity.findMany({
      where: { userId: user.id },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST / — Crear actividad
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as AuthUser;
    const { id, type, entityType, entityId, entityTitle } = req.body;

    const activity = await prisma.activity.create({
      data: {
        ...(id ? { id } : {}),
        type,
        entityType,
        entityId,
        entityTitle,
        userId: user.id,
        timestamp: new Date(),
      },
    });
    res.status(201).json(activity);
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
