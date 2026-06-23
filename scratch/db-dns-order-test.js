const dns = require('dns');
const { PrismaClient } = require('@prisma/client');

// Force IPv4 DNS resolution first
dns.setDefaultResultOrder('ipv4first');

process.env.DATABASE_URL = "postgresql://neondb_owner:npg_Oqm2SWtDVXdQ@ep-little-river-apd6cjiu.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require";

console.log("Using original DATABASE_URL with ipv4first DNS order...");

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
