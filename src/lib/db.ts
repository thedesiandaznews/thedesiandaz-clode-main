import { PrismaClient } from '@prisma/client';
import path from 'path';

// Force the database URL to point to the absolute path of dev.db in the project root.
// This prevents relative path resolution discrepancies between HMR, Turbopack, and Server Actions.
process.env.DATABASE_URL = `file:${path.join(process.cwd(), 'dev.db')}`;

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
