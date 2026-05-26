const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

process.env.DATABASE_URL = "file:./dev.db";

const adapter = new PrismaBetterSqlite3({ 
  url: process.env.DATABASE_URL 
});
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const articleCount = await prisma.article.count();
    const reporterCount = await prisma.reporter.count();
    const categoryCount = await prisma.category.count();
    const epaperCount = await prisma.epaper.count();
    const adBannerCount = await prisma.adBanner.count();

    console.log("=== Database Counts ===");
    console.log(`Articles: ${articleCount}`);
    console.log(`Reporters: ${reporterCount}`);
    console.log(`Categories: ${categoryCount}`);
    console.log(`Epapers: ${epaperCount}`);
    console.log(`AdBanners: ${adBannerCount}`);

    console.log("\n=== Categories ===");
    const categories = await prisma.category.findMany();
    categories.forEach(c => console.log(`- ${c.name} (ID: ${c.id})`));

    console.log("\n=== Reporters ===");
    const reporters = await prisma.reporter.findMany();
    reporters.forEach(r => console.log(`- ${r.fullName} (${r.email}, Status: ${r.status})`));

  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
