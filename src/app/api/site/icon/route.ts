import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { connection } from 'next/server';

export async function GET(request: Request) {
  // Ensure dynamic execution
  await connection();

  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'siteIcon' }
    });

    if (!setting || !setting.value) {
      // Fallback: redirect to the default favicon
      return NextResponse.redirect(new URL('/favicon.ico', request.url));
    }

    const value = setting.value;

    if (value.startsWith('data:')) {
      const parts = value.split(',');
      const mimeMatch = parts[0].match(/data:(.*?);base64/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      const base64Data = parts[1];
      const buffer = Buffer.from(base64Data, 'base64');

      return new Response(buffer, {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400'
        }
      });
    }

    // Otherwise, if it is a direct URL, redirect to it
    return NextResponse.redirect(value);
  } catch (error) {
    console.error('Error serving site icon:', error);
    return NextResponse.redirect(new URL('/favicon.ico', request.url));
  }
}
