import { NextResponse, connection } from 'next/server';
import { getRandomActiveAd } from '@/actions/client-ads';


export async function GET(request: Request) {
  await connection();
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const positionStr = searchParams.get('position');
    
    if (!category || !positionStr) {
      return NextResponse.json({ ad: null }, { status: 400 });
    }

    const position = parseInt(positionStr, 10);
    if (isNaN(position)) {
      return NextResponse.json({ ad: null }, { status: 400 });
    }

    const state = searchParams.get('state') || undefined;
    const district = searchParams.get('district') || undefined;
    
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const lat = latStr ? parseFloat(latStr) : undefined;
    const lng = lngStr ? parseFloat(lngStr) : undefined;

    const userGeo = {
      state,
      district,
      lat: lat !== undefined && !isNaN(lat) ? lat : undefined,
      lng: lng !== undefined && !isNaN(lng) ? lng : undefined,
    };

    // Query geotargeted client ad
    const ad = await getRandomActiveAd(category, position, userGeo);

    return NextResponse.json({ ad });
  } catch (error) {
    console.error("Error in dynamic ad serving API:", error);
    return NextResponse.json({ ad: null }, { status: 500 });
  }
}
