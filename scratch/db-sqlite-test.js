const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Force SQLite for this test
process.env.DATABASE_URL = `file:${path.join(__dirname, '../dev.db')}`;

const prisma = new PrismaClient();

async function main() {
  console.log(`Connecting to local SQLite: ${process.env.DATABASE_URL}`);
  
  const articlesCount = await prisma.article.count();
  const categoriesCount = await prisma.category.count();
  const reportersCount = await prisma.reporter.count();

  console.log(`Counts -> Articles: ${articlesCount}, Categories: ${categoriesCount}, Reporters: ${reportersCount}`);

  if (articlesCount > 0) {
    const sample = await prisma.article.findMany({ take: 3 });
    console.log("Sample article titles:", sample.map(a => a.title));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
