const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const adapter = new PrismaBetterSqlite3({ 
  url: process.env.DATABASE_URL
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Testing Prisma article query...');
  const article = await prisma.article.findFirst();
  console.log('First article:', article);
  
  if (article) {
    console.log('Attempting update on article:', article.id);
    const updated = await prisma.article.update({
      where: { id: article.id },
      data: {
        title: article.title
      }
    });
    console.log('Updated successfully:', updated);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
