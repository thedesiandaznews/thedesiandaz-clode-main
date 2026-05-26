import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adId = searchParams.get('id');

    if (!adId) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Find the campaign ad
    const ad = await prisma.clientAd.findUnique({
      where: { id: adId }
    });

    if (ad) {
      // Record click in database
      await prisma.clientAd.update({
        where: { id: adId },
        data: {
          clicks: {
            increment: 1
          }
        }
      });

      // Redirect user to the target sponsor url
      const destination = ad.linkUrl && ad.linkUrl.trim() !== '' ? ad.linkUrl : '/';
      
      // Ensure the URL has a protocol, otherwise absolute redirect will fail
      let redirectUrl = destination;
      if (destination !== '/' && !/^https?:\/\//i.test(destination)) {
        redirectUrl = `https://${destination}`;
      }

      return NextResponse.redirect(new URL(redirectUrl));
    }

    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error("Error in click redirect tracking API:", error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
