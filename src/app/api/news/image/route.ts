import { connection } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  // Ensure the route handler evaluates dynamically at request time
  await connection();

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response('Missing required parameter (id)', { status: 400 });
    }

    const article = await prisma.article.findUnique({
      where: { id }
    });

    const dataUrl = article?.imageUrl;

    if (!dataUrl) {
      return new Response('Image not found', { status: 404 });
    }

    // Parse Base64 Data URL if matches
    if (dataUrl.startsWith('data:')) {
      const parts = dataUrl.split(',');
      if (parts.length >= 2) {
        const mimeMatch = parts[0].match(/data:(.*?);base64/);
        const contentType = mimeMatch ? mimeMatch[1] : 'image/png';
        const base64Data = parts[1].replace(/\s/g, ''); // strip any newlines or spaces
        const buffer = Buffer.from(base64Data, 'base64');
        return new Response(buffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
          }
        });
      }
    }

    // If it's already a relative path or absolute URL, redirect the client
    if (dataUrl.startsWith('/')) {
      return Response.redirect(new URL(dataUrl, request.url));
    }
    return Response.redirect(dataUrl);
  } catch (error) {
    console.error('Error serving article image:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
