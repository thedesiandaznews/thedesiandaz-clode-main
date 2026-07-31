import { connection } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  // Ensure the route handler evaluates dynamically at request time
  await connection();

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    const screen = searchParams.get('screen') || 'desktop';

    if (!id || !type) {
      return new Response('Missing required parameters (id, type)', { status: 400 });
    }

    let dataUrl: string | null = null;

    if (type === 'banner') {
      const banner = await prisma.banner.findUnique({
        where: { id }
      });
      dataUrl = banner?.imageUrl || null;
    } else if (type === 'clientad') {
      const ad = await prisma.clientAd.findUnique({
        where: { id }
      });
      if (ad) {
        dataUrl = screen === 'mobile' ? ad.mobileImgUrl : ad.desktopImgUrl;
      }
    }

    if (!dataUrl) {
      return new Response('Image not found', { status: 404 });
    }

    // Parse Base64 Data URL if matches
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      const contentType = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');
      return new Response(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        }
      });
    }

    // If it's already a relative path or absolute URL, redirect the client
    if (dataUrl.startsWith('/')) {
      return Response.redirect(new URL(dataUrl, request.url));
    }
    return Response.redirect(dataUrl);
  } catch (error) {
    console.error('Error serving ad image:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
