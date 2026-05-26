import prisma from './src/lib/db';

async function main() {
  try {
    const res = await prisma.epaper.create({
      data: {
        date: new Date('2026-05-18T00:00:00.000Z'),
        title: 'Ranchi Edition',
        pdfUrl: '/uploads/epaper/1778823082182-regist.pdf',
        thumbnailUrl: '/uploads/epaper/1778823074003-IMG-20260504-WA0025.jpg',
        pages: JSON.stringify([
          '/uploads/epaper/1778823074003-IMG-20260504-WA0025.jpg',
          '/uploads/epaper/1778823075976-WhatsApp-Image-2026-05-14-at-10.35.36.jpeg'
        ])
      }
    });
    console.log('Success:', res);
  } catch(e) {
    console.error('Error:', e);
  } finally {
    // Cannot disconnect with adapter properly sometimes, but try
    try { await prisma.$disconnect(); } catch(e){}
  }
}

main();
