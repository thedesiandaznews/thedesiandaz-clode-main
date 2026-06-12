const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const articleCount = await prisma.article.count();
    const reporterCount = await prisma.reporter.count();
    const categoryCount = await prisma.category.count();

    console.log("=== Database Counts ===");
    console.log(`Articles: ${articleCount}`);
    console.log(`Reporters: ${reporterCount}`);
    console.log(`Categories: ${categoryCount}`);

    console.log("\n=== Reporters ===");
    const reporters = await prisma.reporter.findMany();
    reporters.forEach(r => console.log(`- ${r.fullName} (${r.email}, Status: ${r.status}, code: ${r.reporterCode})`));

  } catch(e) {
    console.error("Prisma error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
