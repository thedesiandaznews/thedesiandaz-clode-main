const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const categories = await prisma.adCategory.findMany({
      include: {
        banners: true,
      },
    });
    console.log("Categories in DB:");
    for (const c of categories) {
      console.log(`- "${c.name}" (${c.banners.length} banners)`);
      for (const b of c.banners) {
        console.log(`  - Pos ${b.position}, type ${b.type}, active: ${b.isActive}`);
        console.log(`    imageUrl: ${b.imageUrl}`);
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
