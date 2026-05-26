const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

process.env.DATABASE_URL = "file:./dev.db";

const adapter = new PrismaBetterSqlite3({ 
  url: process.env.DATABASE_URL 
});
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const articles = await prisma.article.findMany({
      include: { category: true }
    });
    console.log("Total articles:", articles.length);
    for (const a of articles) {
      console.log(`- ID: ${a.id}`);
      console.log(`  Title: ${a.title}`);
      console.log(`  Status: ${a.status}`);
      console.log(`  Created: ${a.createdAt}`);
      console.log(`  Category: ${a.category ? a.category.name : 'None'}`);
      console.log(`  Slug: ${a.slug}`);
      console.log("-----------------------------------------");
    }
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
