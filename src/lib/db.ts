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

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
