import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const deleted = await prisma.contributor.deleteMany({
    where: { contributorId: null }
  });
  console.log('Deleted invalid contributors:', deleted.count);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
