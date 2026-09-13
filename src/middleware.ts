import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;
  const normalizedPathname =
    pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  const hostname = host.split(':')[0];
  const isApiConsoleHost = hostname === 'api.credittrust.in';
  const isCrmHost = hostname === 'crm.credittrust.in';
  const isMainPortalHost = hostname === 'credittrust.in';
  const isWwwHost = hostname === 'www.credittrust.in';
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

  const withSearch = (targetPathname: string, origin: string) => {
    const target = new URL(targetPathname, origin);
    target.search = request.nextUrl.search;
    return target;
  };

  const crmWebsitePath = () => {
    const marketingPath = normalizedPathname.replace(/^\/crm-website/, '') || '/';
    return marketingPath === '' ? '/' : marketingPath;
  };

  const isLenderIntelligenceSurface =
    normalizedPathname.startsWith('/admin-lender-intelligence') ||
    normalizedPathname.startsWith('/api/admin-lender-intelligence') ||
    normalizedPathname === '/api/crm/lender-routing';

  if (isApiConsoleHost && normalizedPathname === '/') {
    return NextResponse.rewrite(new URL('/api-console', request.url));
  }

  if (
    isApiConsoleHost &&
    !isAsset &&
    !isApiRoute &&
    !normalizedPathname.startsWith('/api-console')
  ) {
    return NextResponse.rewrite(new URL('/api-console', request.url));
  }

  if (isCrmHost && normalizedPathname === '/login') {
    return NextResponse.rewrite(new URL('/crm/sign-up-login-screen', request.url));
  }

  if (isCrmHost && normalizedPathname.startsWith('/crm-website')) {
    return NextResponse.redirect(withSearch(crmWebsitePath(), 'https://crm.credittrust.in'));
  }

  if (isCrmHost && !isAsset && !isApiRoute && marketingPaths.has(normalizedPathname)) {
    return NextResponse.rewrite(
      new URL(
        normalizedPathname === '/' ? '/crm-website' : `/crm-website${normalizedPathname}`,
        request.url
      )
    );
  }

  if (isCrmHost && !isAsset && !isApiRoute && !normalizedPathname.startsWith('/crm')) {
    return NextResponse.redirect(withSearch(normalizedPathname, 'https://credittrust.in'));
  }

  if (isWwwHost) {
    return NextResponse.redirect(withSearch(normalizedPathname, 'https://credittrust.in'));
  }

  if (isMainPortalHost && normalizedPathname.startsWith('/crm-website')) {
    return NextResponse.redirect(withSearch(crmWebsitePath(), 'https://crm.credittrust.in'));
  }

  if (isMainPortalHost && normalizedPathname.startsWith('/crm')) {
    return NextResponse.redirect(withSearch(normalizedPathname, 'https://crm.credittrust.in'));
  }

  if (isLenderIntelligenceSurface) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
