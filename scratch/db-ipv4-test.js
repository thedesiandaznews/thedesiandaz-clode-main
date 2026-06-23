const { PrismaClient } = require('@prisma/client');

// Use IPv4 address with sslmode=no-verify to bypass hostname validation and IPv6 routing issues
process.env.DATABASE_URL = "postgresql://neondb_owner:npg_Oqm2SWtDVXdQ@52.4.160.253/neondb?sslmode=no-verify";

console.log("Using modified DATABASE_URL:", process.env.DATABASE_URL);

const prisma = new PrismaClient();

async function main() {
  console.time('DB Connect');
  await prisma.$connect();
  console.timeEnd('DB Connect');

  console.time('Count Articles');
  const articlesCount = await prisma.article.count();
  console.timeEnd('Count Articles');

  console.log(`Counts -> Articles: ${articlesCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
