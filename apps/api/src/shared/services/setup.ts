import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import prisma from './prisma';
import argon2 from 'argon2';
import dotenv from 'dotenv';
import crypto from 'crypto';

const getEnvPath = () => {
  const cwd = process.cwd();
  const rootEnv = path.join(cwd, '../../.env');
  if (fs.existsSync(rootEnv)) return rootEnv;
  
  const apiEnv = path.join(cwd, '.env');
  if (fs.existsSync(apiEnv)) return apiEnv;
  
  return rootEnv; // Fallback to root .env
};

export interface SystemStatus {
  ready: boolean;
  configured: boolean;
  database: 'connected' | 'error' | 'schema_missing' | 'unknown';
  details?: string;
  missingTables?: string[];
  checkedAt: string;
}

let _isConfiguredCache: boolean | null = null;
let _systemStatusCache: SystemStatus | null = null;
let _lastCheck: number = 0;
const CACHE_TTL = 30000; // 30 seconds

export const getSystemStatus = async (force: boolean = false): Promise<SystemStatus> => {
  const now = Date.now();
  if (!force && _systemStatusCache && (now - _lastCheck < CACHE_TTL)) {
    return _systemStatusCache;
  }

  const status: SystemStatus = {
    ready: false,
    configured: false,
    database: 'unknown',
    checkedAt: new Date().toISOString()
  };

  try {
    // 1. Check DB Connection
    await prisma.$queryRaw`SELECT 1`;
    status.database = 'connected';
  } catch (error: any) {
    status.database = 'error';
    status.details = error?.message || 'Database connection failed';
    _systemStatusCache = status;
    _lastCheck = now;
    return status;
  }

  try {
    // 2. Check Schema (Tables)
    // For SQLite/LibSQL
    const tables: any[] = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`;
    const tableNames = tables.map(t => t.name.toLowerCase());
    
    const requiredTables = [
      'user', 'workspace', 'group', 'note', 'snippet', 
      'session', 'auditlog', 'activity', 'notification', 
      'connection', 'credential'
    ];
    
    const missingTables = requiredTables.filter(rt => !tableNames.includes(rt));
    
    if (missingTables.length > 0) {
      status.database = 'schema_missing';
      status.missingTables = missingTables;
      status.details = `Missing tables: ${missingTables.join(', ')}`;
      status.ready = false;
    } else {
      status.ready = true;
    }

    // 3. Check if configured (Admin user exists)
    if (status.ready) {
      const userCount = await prisma.user.count();
      status.configured = userCount > 0;
      _isConfiguredCache = status.configured;
    }

  } catch (error: any) {
    status.database = 'error';
    status.details = `Schema check failed: ${error?.message}`;
    status.ready = false;
  }

  _systemStatusCache = status;
  _lastCheck = now;
  return status;
};

export const isConfigured = async () => {
  if (_isConfiguredCache) return true;
  const status = await getSystemStatus();
  return status.configured;
};

export interface DBConfig {
  type: 'sqlite';
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  filename?: string; // For SQLite
}

export interface AdminConfig {
  username: string;
  email: string;
  password: string;
}

export const setupSystem = async (dbConfig: DBConfig, adminConfig: AdminConfig) => {
  // 1. Determine database configuration
  const databaseUrl = process.env.DATABASE_URL || `file:./${dbConfig.filename || 'dev.db'}`;
  const dbProvider = process.env.DB_PROVIDER || dbConfig.type;

  // 2. Load existing .env if it exists
  const envPath = getEnvPath();
  let envConfig: Record<string, string> = {};
  
  if (fs.existsSync(envPath)) {
    try {
      envConfig = dotenv.parse(fs.readFileSync(envPath));
    } catch (error) {
      console.warn(`Warning: Could not parse .env file at ${envPath}`);
    }
  }

  // 3. Update configuration only if not already set in environment
  if (!process.env.DATABASE_URL) {
    envConfig.DATABASE_URL = databaseUrl;
  }
  
  if (!process.env.DB_PROVIDER) {
    envConfig.DB_PROVIDER = dbProvider;
  }

  // 4. Handle Secrets (JWT_SECRET, REFRESH_TOKEN_SECRET)
  const defaultJwtSecret = 'changeme-at-setup';
  const defaultInsecureJwt = 'your-super-secret-jwt-key';
  
  // Current effective secrets (from env or .env)
  const currentJwtSecret = process.env.JWT_SECRET || envConfig.JWT_SECRET;
  const currentRefreshSecret = process.env.REFRESH_TOKEN_SECRET || envConfig.REFRESH_TOKEN_SECRET;

  if (!currentJwtSecret || currentJwtSecret === defaultJwtSecret || currentJwtSecret === defaultInsecureJwt) {
    const secret = crypto.randomBytes(32).toString('hex');
    envConfig.JWT_SECRET = secret;
    process.env.JWT_SECRET = secret;
  }
  
  if (!currentRefreshSecret || currentRefreshSecret === defaultJwtSecret) {
    const secret = crypto.randomBytes(32).toString('hex');
    envConfig.REFRESH_TOKEN_SECRET = secret;
    process.env.REFRESH_TOKEN_SECRET = secret;
  }

  // 4b. Handle Credential Encryption Key
  const currentEncryptionKey = process.env.CREDENTIAL_ENCRYPTION_KEY || envConfig.CREDENTIAL_ENCRYPTION_KEY;
  if (!currentEncryptionKey) {
    const key = crypto.randomBytes(32).toString('hex');
    envConfig.CREDENTIAL_ENCRYPTION_KEY = key;
    process.env.CREDENTIAL_ENCRYPTION_KEY = key;
  }

  // 5. Save .env if we have an envPath (only if we're not in an environment where we shouldn't)
  // We'll write it anyway as a fallback, but the most important thing is that we didn't crash
  try {
    const newEnvContent = Object.entries(envConfig)
      .map(([key, value]) => `${key}="${value}"`)
      .join('\n');
    
    // Ensure directory exists if we're creating a new file
    const envDir = path.dirname(envPath);
    if (!fs.existsSync(envDir)) {
      fs.mkdirSync(envDir, { recursive: true });
    }
    
    fs.writeFileSync(envPath, newEnvContent);
  } catch (error) {
    console.warn(`Warning: Could not write to .env file at ${envPath}`, error);
    // Do not throw here, as we might be in a read-only environment but have env vars set
  }

  // 6. In Prisma 7, connection url is configured in prisma.config.ts, not schema.prisma

  // 7. Ensure database tables exist (push schema to DB)
  // NOTE: Do NOT run `npx prisma generate` here — the generated client already exists,
  // and regenerating it triggers ts-node-dev to restart the server mid-request,
  // which kills this setup flow before the admin user can be created.
  try {
    const serverCwd = process.cwd();

    console.log('[Setup]: Pushing database schema...');
    const output = execSync('npx prisma db push --accept-data-loss', { 
      cwd: serverCwd,
      stdio: 'pipe',
      encoding: 'utf8'
    });
    console.log('[Setup]: Prisma output:', output);
  } catch (error: any) {
    console.error('[Setup]: Prisma setup failed:', error);
    console.error('[Setup]: Error details:', error.stdout || error.message);
    throw new Error('Failed to initialize database schema: ' + (error.stdout || error.message));
  }

  // 5. Create Admin User
  const hashedPassword = await argon2.hash(adminConfig.password);
  await prisma.user.create({
    data: {
      name: adminConfig.username,
      email: adminConfig.email,
      passwordHash: hashedPassword,
      role: 'admin',
      isActive: true,
      emailVerified: true,
    }
  });

  _isConfiguredCache = true;
  _systemStatusCache = null; // Invalidate full status cache
  _lastCheck = 0;
  
  console.log('[Setup]: System configuration completed successfully.');
  return { success: true };
};
