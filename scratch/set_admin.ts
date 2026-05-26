import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.siteSetting.upsert({
    where: { key: 'adminId' },
    update: { value: 'ThedesiandazNews' },
    create: { key: 'adminId', value: 'ThedesiandazNews' }
  });

  await prisma.siteSetting.upsert({
    where: { key: 'adminPassword' },
    update: { value: 'Thedesiandaz@3820' },
    create: { key: 'adminPassword', value: 'Thedesiandaz@3820' }
  });

  console.log('Admin credentials updated successfully in database.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
