const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.article.findMany({
    take: 5,
    select: { id: true, slug: true, title: true }
  });
  console.log("Articles:", articles);
  
  const article = await prisma.article.findUnique({
    where: { slug: 'n-mizur3' }
  });
  console.log("Specific article:", article);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
