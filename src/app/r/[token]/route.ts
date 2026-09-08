import { NextRequest, NextResponse } from 'next/server';
import { requestIp, setB2cSession } from '@/lib/b2c/security';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  logReportTrackingEvent,
  resolveReportTrackingLink,
} from '@/lib/marketing/report-tracking';
import {
  buildB2cReportRedirectUrl,
  logWhatsAppTrackingClick,
} from '@/lib/whatsapp/analytics';

export const runtime = 'nodejs';

function configuredHosts() {
  const values = [
    process.env.WHATSAPP_TRACKING_BASE_URL,
    process.env.NEXT_PUBLIC_PORTAL_URL,
    'https://portal.credittrust.in',
    'https://credittrust.in',
  ].filter(Boolean) as string[];

  return new Set(
    values
      .map((value) => {
        try {
          return new URL(value).host;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as string[],
  );
}

function safeRedirectUrl(request: NextRequest, rawUrl?: string | null, reportRequestId?: string | null) {
  const fallbackPath = reportRequestId ? buildB2cReportRedirectUrl(reportRequestId) : '/get-my-report';
  const requested = rawUrl || fallbackPath;
  const target = new URL(requested, request.url);
  const allowedHosts = configuredHosts();
  allowedHosts.add(request.nextUrl.host);

  if (!['http:', 'https:'].includes(target.protocol)) {
    return new URL(fallbackPath, request.url);
  }

  if (requested.startsWith('http') && !allowedHosts.has(target.host)) {
    return new URL(fallbackPath, request.url);
  }

  return target;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const cleanToken = String(token || '').trim();
  if (!cleanToken) return NextResponse.redirect(new URL('/get-my-report', request.url), 302);

  try {
    const supabase = createAdminClient();
    const link = await resolveReportTrackingLink(supabase, cleanToken).catch(() => null);
    if (link) {
      const logged = await logReportTrackingEvent({
        supabase,
        link,
        eventType: 'click',
        userAgent: request.headers.get('user-agent'),
        ipAddress: requestIp(request),
        referer: request.headers.get('referer') || request.headers.get('referrer'),
      });

      if (logged.expired) {
        return NextResponse.redirect(new URL('/get-my-report?link=expired', request.url), 302);
      }

      const response = NextResponse.redirect(
        safeRedirectUrl(request, link.destination_url, link.report_request_id),
        302,
      );
      response.headers.set('Cache-Control', 'private, no-store');
      if (link.report_request_id) setB2cSession(response, link.report_request_id);
      return response;
    }

    const { send } = await logWhatsAppTrackingClick({
      supabase,
      token: cleanToken,
      userAgent: request.headers.get('user-agent'),
      ipAddress: requestIp(request),
      referrer: request.headers.get('referer') || request.headers.get('referrer'),
    });

    const response = NextResponse.redirect(
      safeRedirectUrl(request, send?.redirect_url, send?.report_request_id),
      302,
    );
    response.headers.set('Cache-Control', 'private, no-store');
    if (send?.report_request_id) setB2cSession(response, send.report_request_id);
    return response;
  } catch (error) {
    console.warn('[whatsapp-tracking] redirect failed:', error instanceof Error ? error.message : error);
    return NextResponse.redirect(new URL('/get-my-report', request.url), 302);
  }
}
