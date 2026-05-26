const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const banners = await prisma.banner.findMany({
      include: {
        category: true,
      }
    });
    console.log("Banners in DB:");
    console.log(JSON.stringify(banners, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
