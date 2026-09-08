import { NextRequest, NextResponse } from 'next/server';
import { clean, jsonError, requireMarketingAdmin } from '@/lib/marketing/api';
import { publishInstagramMedia, publishOrScheduleFacebookPost } from '@/lib/marketing/meta-page';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { auth, response } = await requireMarketingAdmin(request);
  if (response) return response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const platform = clean(body.platform) || 'facebook';
    const postText = clean(body.post_text || body.content_text);
    const mediaUrl = clean(body.media_url) || null;
    const scheduledAt = clean(body.scheduled_at) || null;
    if (!postText && !mediaUrl) return jsonError('Post text or media URL is required.');
    if (platform === 'instagram' && !mediaUrl) return jsonError('Instagram publishing requires an image or video URL.');

    const result = platform === 'instagram'
      ? await publishInstagramMedia({ supabase: auth.supabase, campaignId: id, caption: postText, mediaUrl: mediaUrl as string })
      : await publishOrScheduleFacebookPost({ supabase: auth.supabase, campaignId: id, postText, mediaUrl, scheduledAt });

    if (!result.ok) return jsonError(result.error || 'Meta publish failed', result.status || 502);

    await auth.supabase
      .from('marketing_campaigns')
      .update({ status: scheduledAt ? 'scheduled' : 'published', meta_error: null })
      .eq('id', id);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('[marketing/publish-post] error:', error);
    return jsonError(error instanceof Error ? error.message : 'Unable to publish post', 500);
  }
}
