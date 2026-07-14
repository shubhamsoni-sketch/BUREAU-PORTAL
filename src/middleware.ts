import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;
  const hostname = host.split(':')[0];
  const isApiConsoleHost = hostname === 'api.credittrust.in';
  const isCrmHost = hostname === 'crm.credittrust.in';
  const isAsset = pathname.startsWith('/_next') || pathname.includes('.');
  const isApiRoute = pathname.startsWith('/api/');

  if (isApiConsoleHost && pathname === '/') {
    return NextResponse.rewrite(new URL('/api-console', request.url));
  }

  if (isApiConsoleHost && !isAsset && !isApiRoute && !pathname.startsWith('/api-console')) {
    return NextResponse.rewrite(new URL('/api-console', request.url));
  }

  if (isCrmHost && pathname === '/') {
    return NextResponse.rewrite(new URL('/crm', request.url));
  }

  if (isCrmHost && !isAsset && !isApiRoute && !pathname.startsWith('/crm')) {
    return NextResponse.rewrite(new URL(`/crm${pathname}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
