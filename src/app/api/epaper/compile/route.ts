import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { revalidatePath, updateTag } from 'next/cache';
import { connection } from 'next/server';

export async function POST(request: Request) {
  // Ensure dynamic execution
  await connection();

  try {
    const { sessionId, total, date: dateStr, title } = await request.json();

    if (!sessionId || !total || !dateStr) {
      return NextResponse.json({ success: false, message: 'Missing sessionId, total chunks, or date' }, { status: 400 });
    }

    // 1. Fetch all chunk keys
    const chunkKeys = Array.from({ length: total }, (_, i) => `chunk-${sessionId}-${i}`);
    const chunkRecords = await prisma.pageContent.findMany({
      where: {
        pageSlug: { in: chunkKeys }
      }
    });

    // 2. Map and verify chunks are complete
    const chunksMap = new Map(chunkRecords.map(r => [r.pageSlug, r.content]));
    let combinedBase64 = '';
    
    for (let i = 0; i < total; i++) {
      const key = `chunk-${sessionId}-${i}`;
      const content = chunksMap.get(key);
      if (!content) {
        return NextResponse.json({ 
          success: false, 
          message: `Chunk compilation failed: Missing chunk index ${i}. Please try uploading again.` 
        }, { status: 400 });
      }
      combinedBase64 += content;
    }

    const pdfUrl = `data:application/pdf;base64,${combinedBase64}`;
    const date = new Date(dateStr);

    // 3. Upsert E-paper
    await prisma.epaper.upsert({
      where: { date },
      update: {
        title,
        pdfUrl
      },
      create: {
        date,
        title,
        pdfUrl,
        thumbnailUrl: '',
        pages: '[]'
      }
    });

    // 4. Delete temp chunks from database
    await prisma.pageContent.deleteMany({
      where: {
        pageSlug: { in: chunkKeys }
      }
    });

    revalidatePath('/admin/epaper');
    revalidatePath('/epaper');
    updateTag('epaper');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Compilation error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Compilation failed' }, { status: 500 });
  }
}
