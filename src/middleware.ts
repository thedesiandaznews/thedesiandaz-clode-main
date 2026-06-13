import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const jharkhandDistricts: Record<string, string> = {
  'ranchi': 'ranchi-news',
  'dhanbad': 'dhanbad-news',
  'bokaro': 'bokaro-news',
  'east-singhbhum': 'jamshedpur-news',
  'west-singhbhum': 'west-singhbhum-news',
  'seraikela-kharsawan': 'saraikela-kharsawan-news',
  'hazaribag': 'hazaribagh-news',
  'hazaribagh': 'hazaribagh-news',
  'ramgarh': 'ramgarh-news',
  'chatra': 'chatra-news',
  'koderma': 'koderma-news',
  'giridih': 'giridih-news',
  'palamu': 'palamu-news',
  'garhwa': 'garhwa-news',
  'latehar': 'latehar-news',
  'gumla': 'gumla-news',
  'lohardaga': 'lohardaga-news',
  'simdega': 'simdega-news',
  'khunti': 'khunti-news',
  'pakur': 'pakur-news',
  'dumka': 'dumka-news',
  'deoghar': 'deoghar-news',
  'godda': 'godda-news',
  'sahibganj': 'sahibganj-news',
  'jamtara': 'jamtara-news'
};

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get('host') || '';

  // Check if it is an HTTP request or non-www request
  const isHttp = request.headers.get('x-forwarded-proto') === 'http';
  const isNonWww = host === 'thedesiandaz.com';

  if (isHttp || isNonWww) {
    url.protocol = 'https:';
    url.host = 'www.thedesiandaz.com';
    return NextResponse.redirect(url.toString(), 301);
  }

  const pathname = url.pathname.toLowerCase().replace(/\/$/, '');

  // 1. Redirect /state/jharkhand[/district]
  if (pathname === '/state/jharkhand') {
    url.pathname = '/jharkhand-news';
    return NextResponse.redirect(url.toString(), 301);
  }

  if (pathname.startsWith('/state/jharkhand/')) {
    const districtPart = pathname.substring('/state/jharkhand/'.length);
    const prettySlug = jharkhandDistricts[districtPart];
    if (prettySlug) {
      url.pathname = `/${prettySlug}`;
      return NextResponse.redirect(url.toString(), 301);
    }
  }

  // 2. Redirect legacy /latest?category=[category]
  if (pathname === '/latest') {
    const categoryParam = url.searchParams.get('category');
    if (categoryParam) {
      const catLower = categoryParam.toLowerCase();
      let targetSlug = '';
      if (catLower === 'breaking news') targetSlug = 'breaking-news';
      else if (catLower === 'crime') targetSlug = 'crime';
      else if (catLower === 'politics') targetSlug = 'politics';
      else if (catLower === 'sports') targetSlug = 'sports';
      else if (catLower === 'education') targetSlug = 'education';
      else if (catLower === 'business' || catLower === 'business & finance') targetSlug = 'business';
      else if (catLower === 'entertainment') targetSlug = 'entertainment';

      if (targetSlug) {
        url.pathname = `/${targetSlug}`;
        url.searchParams.delete('category');
        return NextResponse.redirect(url.toString(), 301);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logo.png, founder.png, verify.png, etc. (static public assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
