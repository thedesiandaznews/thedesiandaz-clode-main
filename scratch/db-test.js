const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Manually parse .env since we are running a raw node script
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('DATABASE_URL=')) {
      const val = line.substring('DATABASE_URL='.length).trim().replace(/"/g, '');
      process.env.DATABASE_URL = val;
      break;
    }
  }
}

console.log("Using DATABASE_URL:", process.env.DATABASE_URL);

const prisma = new PrismaClient();

async function main() {
  console.time('DB Connect');
  await prisma.$connect();
  console.timeEnd('DB Connect');

  console.time('Count Articles');
  const articlesCount = await prisma.article.count();
  console.timeEnd('Count Articles');

  console.time('Count Categories');
  const categoriesCount = await prisma.category.count();
  console.timeEnd('Count Categories');

  console.time('Count Reporters');
  const reportersCount = await prisma.reporter.count();
  console.timeEnd('Count Reporters');

  console.log(`Counts -> Articles: ${articlesCount}, Categories: ${categoriesCount}, Reporters: ${reportersCount}`);

  console.time('Fetch Articles (All)');
  const articles = await prisma.article.findMany({
    include: {
      category: true,
    },
    orderBy: { createdAt: 'desc' }
  });
  console.timeEnd('Fetch Articles (All)');

  if (articles.length > 0) {
    const size = JSON.stringify(articles).length;
    console.log(`Fetched ${articles.length} articles, total JSON size in bytes: ${size}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
