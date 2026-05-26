const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const adapter = new PrismaBetterSqlite3({ 
  url: process.env.DATABASE_URL
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const articleId = 'cmpf2tfw90003ecs2145hdi9o';
  const reporterId = 'cmpf2np3v0002ecs2kcii183v';

  console.log('Testing Prisma article query for target article...');
  const existing = await prisma.article.findUnique({
    where: { id: articleId }
  });
  console.log('Target article from DB:', existing);
  
  if (!existing) {
    console.log('Target article not found in DB!');
    return;
  }

  if (existing.reporterId !== reporterId) {
    console.log(`Reporter ID mismatch: ${existing.reporterId} !== ${reporterId}`);
    return;
  }

  const data = {
    title: existing.title, // keep it same for test
    categoryId: existing.categoryId,
    state: existing.state,
    district: existing.district,
    content: existing.content,
    imageUrl: existing.imageUrl || undefined,
    status: 'Pending'
  };

  const updateData = {
    title: data.title,
    categoryId: data.categoryId,
    state: data.state,
    district: data.district,
    content: data.content,
    imageUrl: data.imageUrl !== undefined ? data.imageUrl : existing.imageUrl,
    status: data.status
  };

  if (existing.status === 'Published') {
    const currentEditCount = existing.editCount || 0;
    updateData.editCount = currentEditCount + 1;
  }

  console.log('Update payload:', updateData);

  try {
    const updated = await prisma.article.update({
      where: { id: articleId },
      data: updateData
    });
    console.log('Updated successfully:', updated);
  } catch (err) {
    console.error('Prisma update threw error:', err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
