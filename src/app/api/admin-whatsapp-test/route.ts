import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';
import {
  logWhatsAppEvent,
  normalizeWhatsAppPhone,
  sendWhatsAppTemplate,
} from '@/lib/whatsapp/cloud-api';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if ('error' in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const to = normalizeWhatsAppPhone(body.to);
    const templateName = String(body.templateName || '').trim();
    const languageCode = body.languageCode ? String(body.languageCode).trim() : undefined;
    const bodyValues = Array.isArray(body.bodyValues) ? body.bodyValues : [];

    if (!to || to.length < 11) {
      return NextResponse.json(
        { success: false, error: 'Valid recipient phone number is required.' },
        { status: 400 }
      );
    }

    if (!templateName) {
      return NextResponse.json(
        { success: false, error: 'templateName is required.' },
        { status: 400 }
      );
    }

    const result = await sendWhatsAppTemplate({
      to,
      templateName,
      languageCode,
      bodyValues,
    });

    await logWhatsAppEvent({
      supabase: auth.supabase,
      eventType: 'admin_test_template',
      recipientPhone: to,
      templateName,
      status: result.success ? 'sent' : 'failed',
      userId: auth.user.id,
      messageId: result.messageId ?? null,
      error: result.error ?? null,
      metadata: {
        body_values: bodyValues,
        whatsapp_status: result.status ?? null,
        whatsapp_response: result.response ?? null,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, response: result.response },
        { status: result.status || 502 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      response: result.response,
    });
  } catch (error) {
    console.error('[admin-whatsapp-test] unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 }
    );
  }
}
