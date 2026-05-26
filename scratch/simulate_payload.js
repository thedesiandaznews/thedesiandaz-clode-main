const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const adapter = new PrismaBetterSqlite3({ 
  url: process.env.DATABASE_URL
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const article = await prisma.article.findFirst();
  if (!article) {
    console.log('No articles found');
    return;
  }
  
  console.log('Found article:', article);
  
  const data = {
    title: 'Test News Title Fixed',
    categoryId: article.categoryId,
    state: 'Jharkhand',
    district: 'Pakur',
    content: 'This is a test content. sonuu',
    imageUrl: undefined,
    status: 'Draft'
  };
  
  const existing = article;
  
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
  
  console.log('Update Payload:', updateData);
  
  try {
    const res = await prisma.article.update({
      where: { id: article.id },
      data: updateData
    });
    console.log('Update Successful:', res);
  } catch (err) {
    console.error('Update Failed with Error:', err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
