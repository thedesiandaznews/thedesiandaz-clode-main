require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log("=========================================");
  console.log("DATABASE CONNECTION DIAGNOSTICS");
  console.log("=========================================");
  console.log("Target Database URL:", process.env.DATABASE_URL || "NOT CONFIGURED IN ENV");
  
  try {
    console.log("\nAttempting connection & query...");
    const categoryCount = await prisma.category.count();
    console.log("✅ SUCCESS: Successfully reached and queried Neon database!");
    console.log(`Total Categories in DB: ${categoryCount}`);
  } catch (error) {
    console.error("❌ CONNECTION FAILED!");
    console.error("\nPrisma Error Details:\n", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
