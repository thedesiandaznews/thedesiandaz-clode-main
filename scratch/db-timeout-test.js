const { PrismaClient } = require('@prisma/client');

// Use original DATABASE_URL with an increased connection timeout of 30 seconds
process.env.DATABASE_URL = "postgresql://neondb_owner:npg_Oqm2SWtDVXdQ@ep-little-river-apd6cjiu.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=30";

console.log("Using DATABASE_URL with connect_timeout=30:", process.env.DATABASE_URL);

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
