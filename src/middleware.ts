import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;
  const normalizedPathname =
    pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
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
    '/privacy-policy',
    '/terms-and-conditions',
  ]);

  if (isApiConsoleHost && normalizedPathname === '/') {
    return NextResponse.rewrite(new URL('/api-console', request.url));
  }

  if (isApiConsoleHost && !isAsset && !isApiRoute && !normalizedPathname.startsWith('/api-console')) {
    return NextResponse.rewrite(new URL('/api-console', request.url));
  }

  if (isCrmHost && (normalizedPathname === '/' || normalizedPathname === '/login')) {
    return NextResponse.rewrite(new URL('/crm/sign-up-login-screen', request.url));
  }

  if (isCrmHost && normalizedPathname.startsWith('/crm-website')) {
    const marketingPath = normalizedPathname.replace(/^\/crm-website/, '') || '/';
    return NextResponse.redirect(new URL(marketingPath, 'https://credittrust.in'));
  }

  if (
    isCrmHost &&
    !isAsset &&
    !isApiRoute &&
    !normalizedPathname.startsWith('/crm')
  ) {
    return NextResponse.redirect(new URL(normalizedPathname, 'https://credittrust.in'));
  }

  if (isMarketingHost && normalizedPathname.startsWith('/crm')) {
    return NextResponse.redirect(new URL(normalizedPathname, 'https://crm.credittrust.in'));
  }

  if (isMarketingHost && !isAsset && !isApiRoute && marketingPaths.has(normalizedPathname)) {
    return NextResponse.rewrite(new URL(normalizedPathname === '/' ? '/crm-website' : `/crm-website${normalizedPathname}`, request.url));
  }

  if (isMarketingHost && !isAsset && !isApiRoute && !normalizedPathname.startsWith('/crm-website')) {
    return NextResponse.redirect(new URL(normalizedPathname, 'https://portal.credittrust.in'));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
