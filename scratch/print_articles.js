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
    console.log("=== ALL ARTICLES IN DB ===");
    articles.forEach((art, idx) => {
      console.log(`\n${idx + 1}. Title: ${art.title}`);
      console.log(`   ID: ${art.id}`);
      console.log(`   Slug: ${art.slug}`);
      console.log(`   Status: ${art.status}`);
      console.log(`   Category: ${art.category?.name} (${art.categoryId})`);
      console.log(`   Reporter: ${art.reporter} (ID: ${art.reporterId})`);
      console.log(`   Created At: ${art.createdAt}`);
    });
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
