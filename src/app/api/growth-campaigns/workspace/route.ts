import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';

function jsonError(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

function isAuthError(auth: unknown): auth is { error: string; status: number } {
  return Boolean(auth && typeof auth === 'object' && 'error' in auth);
}

function clean(value: unknown) {
  return String(value ?? '').trim();
}

function tableMissing(error: any) {
  return error?.code === '42P01' || String(error?.message || '').includes('does not exist');
}

function summarizeConversations(conversations: any[], messages: any[]) {
  return {
    open: conversations.filter((item) => item.status === 'open').length,
    qualified: conversations.filter((item) => item.status === 'qualified').length,
    callbackRequired: conversations.filter((item) => item.status === 'callback_required').length,
    doNotContact: conversations.filter((item) => item.status === 'do_not_contact').length,
    aiReplies: messages.filter((item) => item.ai_generated && item.direction === 'outbound').length,
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if (isAuthError(auth)) return jsonError(auth.error, auth.status);

  try {
    const [settingsResult, conversationsResult, messagesResult, campaignsResult, leadResult] =
      await Promise.all([
        auth.supabase
          .from('growth_campaign_settings')
          .select('*')
          .eq('id', 'default')
          .maybeSingle(),
        auth.supabase
          .from('communication_conversations')
          .select('*')
          .order('last_message_at', { ascending: false, nullsFirst: false })
          .limit(250),
        auth.supabase
          .from('communication_messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1000),
        auth.supabase
          .from('promotion_campaigns')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
        auth.supabase
          .from('lead_finder_master')
          .select('id,is_valid_mobile,email,status', { count: 'exact', head: false })
          .limit(1),
      ]);

    const firstError = [
      settingsResult.error,
      conversationsResult.error,
      messagesResult.error,
      campaignsResult.error,
    ].find(Boolean);

    if (firstError && tableMissing(firstError)) {
      return NextResponse.json({
        success: true,
        schemaReady: false,
        warning: 'Communication database is not active yet. Run the Growth Campaigns migration.',
        settings: null,
        conversations: [],
        messages: [],
        campaigns: [],
        summary: null,
      });
    }
    if (firstError) throw new Error(firstError.message);

    const conversations = conversationsResult.data || [];
    const messages = messagesResult.data || [];
    const campaigns = campaignsResult.data || [];
    const leadCount = leadResult.count || 0;

    return NextResponse.json({
      success: true,
      schemaReady: true,
      settings: settingsResult.data || null,
      conversations,
      messages,
      campaigns,
      summary: {
        totalLeads: leadCount,
        campaigns: campaigns.length,
        conversations: conversations.length,
        ...summarizeConversations(conversations, messages),
      },
    });
  } catch (error) {
    console.error('[growth-campaigns/workspace] load failed:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Unable to load Growth Campaigns',
      500
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if (isAuthError(auth)) return jsonError(auth.error, auth.status);

  try {
    const body = await request.json().catch(() => ({}));
    const action = clean(body.action);

    if (action === 'save_settings') {
      const row = {
        id: 'default',
        ai_auto_reply_enabled: body.ai_auto_reply_enabled !== false,
        whatsapp_enabled: body.whatsapp_enabled !== false,
        email_enabled: body.email_enabled === true,
        product_context: clean(body.product_context) || 'DSA Portal and CIBIL Pull',
        reply_tone: clean(body.reply_tone) || 'clear_professional',
        knowledge_base: clean(body.knowledge_base),
        max_auto_replies_per_thread: Math.max(
          1,
          Math.min(100, Number(body.max_auto_replies_per_thread || 20))
        ),
      };

      const { data, error } = await auth.supabase
        .from('growth_campaign_settings')
        .upsert(row, { onConflict: 'id', ignoreDuplicates: false })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return NextResponse.json({ success: true, settings: data });
    }

    if (action === 'update_conversation') {
      const id = clean(body.id);
      if (!id) return jsonError('Conversation id is required.');
      const patch: Record<string, unknown> = {};
      if (body.status) patch.status = clean(body.status);
      if (body.priority) patch.priority = clean(body.priority);
      if (body.intent) patch.intent = clean(body.intent);
      if (typeof body.ai_enabled === 'boolean') patch.ai_enabled = body.ai_enabled;
      const { data, error } = await auth.supabase
        .from('communication_conversations')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return NextResponse.json({ success: true, conversation: data });
    }

    return jsonError('Invalid action.');
  } catch (error) {
    console.error('[growth-campaigns/workspace] action failed:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Unable to update Growth Campaigns',
      500
    );
  }
}
