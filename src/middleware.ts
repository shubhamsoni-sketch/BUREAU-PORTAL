import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;
  const normalizedPathname =
    pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  const hostname = host.split(':')[0];
  const isApiConsoleHost = hostname === 'api.credittrust.in';
  const isApiHubHost = hostname === 'hub.credittrust.in';
  const isApiClientPortalHost = hostname === 'client.credittrust.in';
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

  if (
    normalizedPathname === '/credit-intelligence' &&
    request.nextUrl.searchParams.get('request_id') === 'shakti-demo'
  ) {
    const sampleReportUrl = new URL('/sample-report', request.url);
    sampleReportUrl.searchParams.set('request_id', 'shakti-demo');
    return NextResponse.redirect(sampleReportUrl);
  }

  if (isApiConsoleHost && !isAsset && !isApiRoute) {
    return NextResponse.json(
      {
        success: false,
        error: 'Not found',
      },
      {
        status: 404,
        headers: {
          'cache-control': 'no-store',
        },
      },
    );
  }

  if (isApiHubHost && !isAsset && !isApiRoute) {
    if (normalizedPathname.startsWith('/client')) {
      return NextResponse.rewrite(new URL('/api-client-portal', request.url));
    }

    if (normalizedPathname === '/' || normalizedPathname.startsWith('/admin')) {
      return NextResponse.rewrite(new URL('/api-console', request.url));
    }

    if (!normalizedPathname.startsWith('/api-console')) {
      return NextResponse.rewrite(new URL('/api-console', request.url));
    }
  }

  if (isApiClientPortalHost && !isAsset && !isApiRoute) {
    return NextResponse.rewrite(new URL('/api-client-portal', request.url));
  }

  if (isCrmHost && normalizedPathname === '/login') {
    return NextResponse.rewrite(new URL('/crm/sign-up-login-screen', request.url));
  }

  if (isCrmHost && normalizedPathname.startsWith('/crm-website')) {
    return NextResponse.redirect(withSearch(crmWebsitePath(), 'https://crm.credittrust.in'));
  }

  if (isCrmHost && !isAsset && !isApiRoute && marketingPaths.has(normalizedPathname)) {
    return NextResponse.rewrite(new URL(normalizedPathname === '/' ? '/crm-website' : `/crm-website${normalizedPathname}`, request.url));
  }

  if (
    isCrmHost &&
    !isAsset &&
    !isApiRoute &&
    !normalizedPathname.startsWith('/crm')
  ) {
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

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
