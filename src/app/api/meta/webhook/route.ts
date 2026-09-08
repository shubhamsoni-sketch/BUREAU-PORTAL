import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyMetaSignature } from '@/lib/marketing/meta-auth';

function verifyToken() {
  return process.env.META_WEBHOOK_VERIFY_TOKEN || process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '';
}

function json(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, { status });
}

async function findCampaignByPost(supabase: ReturnType<typeof createAdminClient>, postId: string | null) {
  if (!postId) return null;
  const { data } = await supabase
    .from('meta_page_posts')
    .select('campaign_id')
    .or(`meta_post_id.eq.${postId},meta_media_id.eq.${postId}`)
    .maybeSingle();
  return data?.campaign_id || null;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get('hub.mode');
  const token = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');

  if (mode === 'subscribe' && token && token === verifyToken()) {
    return new Response(challenge || '', { status: 200 });
  }

  return new Response('Forbidden', { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = verifyMetaSignature(rawBody, request.headers.get('x-hub-signature-256'));
    if (process.env.META_WEBHOOK_REQUIRE_SIGNATURE === 'true' && !signature.verified) {
      return json({ success: false, error: 'Invalid signature' }, 401);
    }

    const payload = JSON.parse(rawBody || '{}');
    const supabase = createAdminClient();
    const entries = Array.isArray(payload?.entry) ? payload.entry : [];
    let logged = 0;

    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];
      for (const change of changes) {
        const value = change?.value || {};
        const postId = value.post_id || value.media_id || value.parent_id || value.item_id || null;
        const campaignId = await findCampaignByPost(supabase, postId);
        const engagementType = value.comment_id ? 'comment' : value.reaction_type ? 'reaction' : value.verb || change.field || 'meta_event';
        const occurredAt = value.created_time
          ? new Date(Number(value.created_time) * 1000).toISOString()
          : new Date().toISOString();

        await supabase.from('campaign_events').insert({
          campaign_id: campaignId,
          event_type: `meta_${engagementType}`,
          event_source: 'meta_webhook',
          event_data_json: {
            object: payload.object ?? null,
            entry_id: entry?.id ?? null,
            field: change?.field ?? null,
            post_id: postId,
            value,
          },
          occurred_at: occurredAt,
        });

        if (postId && ['comment', 'reaction', 'share'].includes(String(engagementType))) {
          await supabase.from('post_engagement_events').upsert({
            campaign_id: campaignId,
            meta_post_id: String(postId),
            engagement_type: String(engagementType),
            meta_user_id: value.from?.id || value.sender_id || null,
            user_name: value.from?.name || null,
            comment_id: value.comment_id || null,
            comment_text: value.message || null,
            raw_payload_json: value,
            occurred_at: occurredAt,
          }, { onConflict: 'meta_post_id,engagement_type,comment_id', ignoreDuplicates: true });
        }

        logged += 1;
      }
    }

    return json({ success: true, logged, signature_checked: Boolean(request.headers.get('x-hub-signature-256')) });
  } catch (error) {
    console.error('[meta-webhook] failed:', error instanceof Error ? error.message : error);
    return json({ success: false, error: 'Meta webhook failed' }, 500);
  }
}
