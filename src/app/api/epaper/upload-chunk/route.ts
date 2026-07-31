import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { connection } from 'next/server';

export async function POST(request: Request) {
  // Ensure dynamic execution
  await connection();

  try {
    const { sessionId, index, chunk } = await request.json();

    if (!sessionId || index === undefined || !chunk) {
      return NextResponse.json({ success: false, message: 'Missing sessionId, index, or chunk content' }, { status: 400 });
    }

    const key = `chunk-${sessionId}-${index}`;

    // Store the chunk temporarily in PageContent table
    await prisma.pageContent.upsert({
      where: { pageSlug: key },
      update: { content: chunk },
      create: { pageSlug: key, content: chunk }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving chunk:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to save chunk' }, { status: 500 });
  }
}
