import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { connection } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: Request) {
  // Ensure dynamic execution at request time
  await connection();

  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'siteIcon' }
    });

    if (setting && setting.value) {
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

      // If it is a direct URL, redirect to it
      return NextResponse.redirect(value);
    }
  } catch (error) {
    console.error('Error fetching dynamic favicon:', error);
  }

  // Fallback: Serve the default-favicon.ico file from public folder
  try {
    const filePath = join(process.cwd(), 'public', 'default-favicon.ico');
    const buffer = await readFile(filePath);
    return new Response(buffer, {
      headers: {
        'Content-Type': 'image/x-icon',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch (fallbackError) {
    console.error('Fallback favicon serve error:', fallbackError);
    return new Response('', { status: 404 });
  }
}
