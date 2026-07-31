import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { revalidatePath, revalidateTag } from 'next/cache';
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
    const buffers: Buffer[] = [];
    
    for (let i = 0; i < total; i++) {
      const key = `chunk-${sessionId}-${i}`;
      const content = chunksMap.get(key);
      if (!content) {
        return NextResponse.json({ 
          success: false, 
          message: `Chunk compilation failed: Missing chunk index ${i}. Please try uploading again.` 
        }, { status: 400 });
      }
      buffers.push(Buffer.from(content, 'base64'));
    }

    const combinedBuffer = Buffer.concat(buffers);
    const pdfUrl = `data:application/pdf;base64,${combinedBuffer.toString('base64')}`;
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    // 3. Upsert E-paper using proven findUnique + update/create logic
    const existing = await prisma.epaper.findUnique({
      where: { date }
    });

    if (existing) {
      await prisma.epaper.update({
        where: { id: existing.id },
        data: {
          title,
          pdfUrl
        }
      });
    } else {
      await prisma.epaper.create({
        data: {
          date,
          title,
          pdfUrl,
          thumbnailUrl: '',
          pages: '[]'
        }
      });
    }

    // 4. Delete temp chunks from database
    await prisma.pageContent.deleteMany({
      where: {
        pageSlug: { in: chunkKeys }
      }
    });

    revalidatePath('/admin/epaper');
    revalidatePath('/epaper');
    revalidateTag('epaper', 'default');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Compilation error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Compilation failed' }, { status: 500 });
  }
}
