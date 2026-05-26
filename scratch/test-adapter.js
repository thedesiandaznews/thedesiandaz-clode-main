const path = require('path');
process.env.DATABASE_URL = `file:${path.join(process.cwd(), 'dev.db')}`;

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const settings = await prisma.siteSetting.findMany();
  console.log("Settings count:", settings.length);
  const articles = await prisma.article.findMany({ take: 1 });
  console.log("Articles count:", articles.length);
}

test().catch(console.error);
