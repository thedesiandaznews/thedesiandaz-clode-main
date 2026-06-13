import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
