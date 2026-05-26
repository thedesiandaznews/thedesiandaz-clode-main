// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import path from 'path';

// Force the database URL to point to the absolute path of dev.db in the project root.
// This prevents relative path resolution discrepancies between HMR, Turbopack, and Server Actions.
process.env.DATABASE_URL = `file:${path.join(process.cwd(), 'dev.db')}`;

// Ensure a single PrismaClient instance for the entire application.
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  // In production, we don't want to create multiple instances.
  prisma = new PrismaClient();
} else {
  // In development, use a global variable to preserve the client across HMR.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globalAny: any = global;
  if (!globalAny.__prisma) {
    globalAny.__prisma = new PrismaClient();
  }
  prisma = globalAny.__prisma;
}

export { prisma };
