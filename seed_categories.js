const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categories = [
  'राष्ट्रीय',
  'अंतरराष्ट्रीय',
  'स्थानीय / राज्य',
  'राजनीति',
  'अपराध',
  'मनोरंजन',
  'खेल',
  'व्यापार / अर्थव्यवस्था',
  'धर्म और संस्कृति',
  'शिक्षा और करियर',
  'तकनीक और विज्ञान',
  'स्वास्थ्य और जीवनशैली'
];

async function main() {
  console.log('Seeding categories to Neon PostgreSQL database...');
  for (const catName of categories) {
    try {
      const existing = await prisma.category.findUnique({
        where: { name: catName }
      });
      if (!existing) {
        const cat = await prisma.category.create({
          data: { name: catName }
        });
        console.log(`Successfully created category: ${cat.name}`);
      } else {
        console.log(`Category already exists: ${catName}`);
      }
    } catch (e) {
      console.error(`Error creating category ${catName}:`, e);
    }
  }
  console.log('Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('Fatal seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
