const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ads = await prisma.ad.findMany();
  console.log(JSON.stringify(ads, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
