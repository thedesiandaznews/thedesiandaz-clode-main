import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { connection } from 'next/server';

export async function GET(request: Request) {
  // Ensure dynamic execution
  await connection();

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response('Missing E-paper ID', { status: 400 });
    }

    const epaper = await prisma.epaper.findUnique({
      where: { id }
    });

    if (!epaper || !epaper.pdfUrl) {
      return new Response('E-paper PDF not found', { status: 404 });
    }

    // Check if the pdfUrl is a Base64 data URL
    if (epaper.pdfUrl.startsWith('data:application/pdf;base64,')) {
      const base64Data = epaper.pdfUrl.replace('data:application/pdf;base64,', '');
      const buffer = Buffer.from(base64Data, 'base64');

      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline; filename="epaper.pdf"',
          'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400'
        }
      });
    }

    // Otherwise, it is an external link (Google Drive, Dropbox, etc.) — redirect to it
    return NextResponse.redirect(epaper.pdfUrl);
  } catch (error: any) {
    console.error('Error streaming epaper PDF:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
