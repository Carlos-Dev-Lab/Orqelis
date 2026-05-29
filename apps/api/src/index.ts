import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { validateEnv } from './shared/utils/envValidator';

const loadEnv = () => {
  const cwd = process.cwd();
  // In monorepo, .env is usually at root
  const rootDir = path.resolve(cwd, '../../');
  const apiDir = cwd;

  // Load root .env
  if (fs.existsSync(path.join(rootDir, '.env'))) {
    dotenv.config({ path: path.join(rootDir, '.env') });
  }
  // Load api .env (override)
  if (fs.existsSync(path.join(apiDir, '.env'))) {
    dotenv.config({ path: path.join(apiDir, '.env'), override: true });
  }

  // Validate environment variables after loading
  validateEnv();
};

loadEnv();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import authRoutes from './modules/auth';
import dbRoutes from './modules/database';
import adminRoutes from './modules/admin';
import setupRoutes from './modules/setup';
import workspacesRoutes from './modules/workspaces';
import groupsRoutes from './modules/groups';
import notesRoutes from './modules/notes';
import snippetsRoutes from './modules/snippets';
import connectionsRoutes from './modules/connections';
import notificationsRoutes from './modules/notifications';
import activitiesRoutes from './modules/activities';
import importRoutes from './modules/admin/import';

import { getSystemStatus } from './shared/services/setup';
import { ensureConfigured } from './shared/middleware/setupCheck';

const app = express();
const port = process.env.PORT || 3001;

// Support BigInt in JSON serialization
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// Global Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // Limit each IP to 1000 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

// Auth Rate Limiter
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 auth attempts per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' }
});

// Security Middleware
app.use(helmet());
app.use(cookieParser());

// CORS Configuration
const isProd = process.env.NODE_ENV === 'production';
const allowedOrigins = isProd 
  ? [process.env.FRONTEND_ORIGIN].filter(Boolean) as string[]
  : ['http://localhost:3000', 'http://localhost:5173', process.env.FRONTEND_ORIGIN].filter(Boolean) as string[];

if (isProd && allowedOrigins.length === 0) {
  console.error('CRITICAL: FRONTEND_ORIGIN is not defined in production environment.');
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl) if not in production
    // or if the origin is in the allowed list
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body Parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply global rate limit
app.use(globalLimiter);

// Setup route (must be before ensureConfigured to avoid chicken-and-egg)
app.use('/api/setup', setupRoutes);

// Ensure system is configured for all other API routes
app.use('/api', ensureConfigured);

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/db', dbRoutes);
app.use('/api/admin', adminRoutes);

// REST API routes (server-first architecture)
app.use('/api/workspaces', workspacesRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/snippets', snippetsRoutes);
app.use('/api/connections', connectionsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/import', importRoutes);

// 404 Handler for API
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const isProduction = process.env.NODE_ENV === 'production';
  console.error(`[Global Error Handler] [${req.method} ${req.path}]:`, err);
  
  const status = err.status || 500;
  // Don't leak internal error messages in production for 500 errors
  const message = isProduction && status === 500 
    ? 'Internal Server Error' 
    : (err.message || 'Internal Server Error');

  res.status(status).json({
    error: message,
    ...(isProduction ? {} : { stack: err.stack })
  });
});

app.get('/health', async (_req, res) => {
  try {
    const status = await getSystemStatus();
    res.status(status.ready ? 200 : 503).json({
      status: status.ready ? 'ok' : 'unhealthy',
      ...status,
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development'
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: 'Failed to check health' });
  }
});

const server = app.listen(port, async () => {
  console.log(`Server running at http://localhost:${port}`);
  
  // Initial system health check
  try {
    const status = await getSystemStatus(true);
    if (!status.ready) {
      console.warn('[System]: Warning - System is not ready:', status.details);
    } else if (!status.configured) {
      console.log('[System]: System is ready but needs initial configuration (Setup Wizard)');
    } else {
      console.log('[System]: System is fully operational and configured.');
    }
  } catch (err) {
    console.error('[System]: Critical error during initial health check:', err);
  }
});

// Handle Graceful Shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`${signal} signal received: closing HTTP server`);
  server.close(async () => {
    console.log('HTTP server closed');
    try {
      const prisma = (await import('./shared/services/prisma')).default;
      await prisma.$disconnect();
      console.log('Database connection closed');
    } catch (err) {
      console.error('Error during database disconnection:', err);
    }
    process.exit(0);
  });
  
  // Force exit after 10 seconds if server.close() hangs
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle Uncaught Errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
