import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { revalidatePath, updateTag } from 'next/cache';
import { connection } from 'next/server';

export async function POST(request: Request) {
  // Ensure the route handler evaluates dynamically at request time
  await connection();

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const dateStr = formData.get('date');
    const title = formData.get('title') as string || '';

    if (!file || !(file instanceof File) || !dateStr) {
      return NextResponse.json({ success: false, message: 'Missing file or publication date' }, { status: 400 });
    }

    // Convert file to Base64 directly on the server
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const pdfUrl = `data:application/pdf;base64,${base64}`;

    // Target publication date
    const date = new Date(dateStr as string);

    // Upsert E-paper in the database
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

    revalidatePath('/admin/epaper');
    revalidatePath('/epaper');
    updateTag('epaper');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('E-paper upload API error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Upload and save failed' }, { status: 500 });
  }
}
