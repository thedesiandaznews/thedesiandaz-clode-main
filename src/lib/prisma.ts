// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import path from 'path';

// Resolve the database URL dynamically. If not set, default to 'dev.db' in the project root.
// If it's a relative file path, make it absolute using process.cwd() to prevent discrepancies in Next.js Server Actions.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${path.join(process.cwd(), 'dev.db')}`;
} else if (process.env.DATABASE_URL.startsWith('file:')) {
  const filePath = process.env.DATABASE_URL.replace('file:', '');
  if (!path.isAbsolute(filePath)) {
    process.env.DATABASE_URL = `file:${path.resolve(process.cwd(), filePath)}`;
  }
}

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
