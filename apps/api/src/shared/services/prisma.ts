import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import dotenv from 'dotenv';

import path from 'path';
import fs from 'fs';

let rootDir: string = '';
let apiDir: string = '';

const loadEnv = () => {
  const cwd = process.cwd();
  let isInsideApi = cwd.endsWith('api');
  
  if (!isInsideApi && fs.existsSync(path.join(cwd, 'package.json'))) {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
    if (pkg.name === 'api') isInsideApi = true;
  }
  
  rootDir = isInsideApi ? path.resolve(cwd, '../../') : cwd;
  apiDir = isInsideApi ? cwd : path.join(rootDir, 'apps/api');

  // Load root .env
  if (fs.existsSync(path.join(rootDir, '.env'))) {
    dotenv.config({ path: path.join(rootDir, '.env') });
  }
  // Load api .env (override)
  if (fs.existsSync(path.join(apiDir, '.env'))) {
    dotenv.config({ path: path.join(apiDir, '.env'), override: true });
  }
};

loadEnv();

const provider = process.env.DB_PROVIDER || 'sqlite';

let prisma: PrismaClient;

if (provider === 'sqlite') {
  let dbUrl = process.env.DATABASE_URL || 'file:./dev.db';

  if (dbUrl.startsWith('file:')) {
    let dbPath = dbUrl.replace('file:', '');
    // Remove ./ if present at the start
    if (dbPath.startsWith('./')) dbPath = dbPath.substring(2);
    if (!path.isAbsolute(dbPath)) {
      dbUrl = `file:${path.resolve(apiDir, dbPath)}`;
    }
  }

  const adapter = new PrismaLibSql({
    url: dbUrl,
  });
  prisma = new PrismaClient({ adapter });
} else {
  prisma = new PrismaClient();
}

export const getPrisma = () => prisma;

export const updatePrismaConfig = (config: { provider: string; url: string }) => {
  // In a real scenario with Prisma, changing the provider at runtime is hard.
  // One way is to have multiple clients or re-generate.
  // For this exercise, we will assume we update the environment variable 
  // and the user might need to restart or we could try to re-instantiate if it's the same provider.
  
  // Note: Changing provider dynamically in Prisma usually requires a re-build of the client.
  // We'll simulate the configuration update here.
  console.log(`Updating DB config: ${config.provider} at ${config.url}`);
  
  // For now, let's just re-instantiate with the new URL if it's the same provider.
  // If provider changes, in a real app you'd need a different client package.
};

export default prisma;
