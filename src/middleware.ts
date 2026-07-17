import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;
  const hostname = host.split(':')[0];
  const isApiConsoleHost = hostname === 'api.credittrust.in';
  const isCrmHost = hostname === 'crm.credittrust.in';
  const isMarketingHost = hostname === 'credittrust.in' || hostname === 'www.credittrust.in';
  const isAsset = pathname.startsWith('/_next') || pathname.includes('.');
  const isApiRoute = pathname.startsWith('/api/');
  const marketingPaths = new Set([
    '/',
    '/features',
    '/eligibility-checker',
    '/pricing',
    '/about',
    '/contact',
  ]);
  const legalPaths = new Set(['/privacy-policy', '/terms-and-conditions']);

  if (isApiConsoleHost && pathname === '/') {
    return NextResponse.rewrite(new URL('/api-console', request.url));
  }

  if (isApiConsoleHost && !isAsset && !isApiRoute && !pathname.startsWith('/api-console')) {
    return NextResponse.rewrite(new URL('/api-console', request.url));
  }

  if (isCrmHost && (pathname === '/' || pathname === '/login')) {
    return NextResponse.rewrite(new URL('/crm/sign-up-login-screen', request.url));
  }

  if (isCrmHost && pathname.startsWith('/crm-website')) {
    const marketingPath = pathname.replace(/^\/crm-website/, '') || '/';
    return NextResponse.redirect(new URL(marketingPath, 'https://credittrust.in'));
  }

  if (
    isCrmHost &&
    !isAsset &&
    !isApiRoute &&
    !pathname.startsWith('/crm')
  ) {
    return NextResponse.redirect(new URL(pathname, 'https://credittrust.in'));
  }

  if (isMarketingHost && pathname.startsWith('/crm')) {
    return NextResponse.redirect(new URL(pathname, 'https://crm.credittrust.in'));
  }

  if (isMarketingHost && !isAsset && !isApiRoute && legalPaths.has(pathname)) {
    return NextResponse.next();
  }

  if (isMarketingHost && !isAsset && !isApiRoute && marketingPaths.has(pathname)) {
    return NextResponse.rewrite(new URL(pathname === '/' ? '/crm-website' : `/crm-website${pathname}`, request.url));
  }

  if (isMarketingHost && !isAsset && !isApiRoute && !pathname.startsWith('/crm-website')) {
    return NextResponse.redirect(new URL(pathname, 'https://portal.credittrust.in'));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
