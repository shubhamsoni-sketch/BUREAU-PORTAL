import { assertMetaConfig, getMetaConfig, metaGraphFetch } from './meta-auth';

type SupabaseLike = {
  from: (table: string) => any;
};

function unixSeconds(value: string) {
  return Math.floor(new Date(value).getTime() / 1000);
}

function isVideo(url?: string | null) {
  return Boolean(url && /\.(mp4|mov|m4v)(\?|$)/i.test(url));
}

function isImage(url?: string | null) {
  return Boolean(url && /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url));
}

export async function publishOrScheduleFacebookPost(params: {
  supabase: SupabaseLike;
  campaignId: string;
  postText: string;
  mediaUrl?: string | null;
  scheduledAt?: string | null;
}) {
  const config = assertMetaConfig(['pageAccessToken', 'pageId']);
  const scheduled = Boolean(params.scheduledAt);
  const basePayload: Record<string, unknown> = {
    published: scheduled ? false : true,
  };
  if (scheduled && params.scheduledAt) basePayload.scheduled_publish_time = unixSeconds(params.scheduledAt);

  let endpoint = `${config.pageId}/feed`;
  let payload: Record<string, unknown> = { ...basePayload, message: params.postText };

  if (params.mediaUrl && isImage(params.mediaUrl)) {
    endpoint = `${config.pageId}/photos`;
    payload = {
      ...basePayload,
      url: params.mediaUrl,
      caption: params.postText,
    };
  } else if (params.mediaUrl && isVideo(params.mediaUrl)) {
    endpoint = `${config.pageId}/videos`;
    payload = {
      ...basePayload,
      file_url: params.mediaUrl,
      description: params.postText,
    };
  }

  const result = await metaGraphFetch(endpoint, {
    method: 'POST',
    token: config.pageAccessToken,
    body: payload,
  });

  const metaPostId = (result.data as any)?.post_id || (result.data as any)?.id || null;
  const now = new Date().toISOString();
  const { data, error } = await params.supabase
    .from('meta_page_posts')
    .insert({
      campaign_id: params.campaignId,
      platform: 'facebook',
      page_id: config.pageId,
      meta_post_id: metaPostId,
      post_text: params.postText,
      media_url: params.mediaUrl ?? null,
      scheduled_at: params.scheduledAt ?? null,
      published_at: result.ok && !scheduled ? now : null,
      status: result.ok ? (scheduled ? 'scheduled' : 'published') : 'failed',
      error_message: result.error ?? null,
      raw_response_json: result.data || {},
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  await params.supabase.from('campaign_events').insert({
    campaign_id: params.campaignId,
    event_type: result.ok ? (scheduled ? 'facebook_post_scheduled' : 'facebook_post_published') : 'facebook_post_failed',
    event_source: 'meta_page_api',
    event_data_json: {
      meta_post_id: metaPostId,
      status: result.status,
      error: result.error ?? null,
    },
    occurred_at: now,
  });

  return { ...result, post: data };
}

export async function publishInstagramMedia(params: {
  supabase: SupabaseLike;
  campaignId: string;
  caption: string;
  mediaUrl: string;
}) {
  const config = assertMetaConfig(['accessToken', 'instagramUserId']);
  const createPayload: Record<string, unknown> = isVideo(params.mediaUrl)
    ? { media_type: 'REELS', video_url: params.mediaUrl, caption: params.caption }
    : { image_url: params.mediaUrl, caption: params.caption };

  const create = await metaGraphFetch<{ id?: string }>(`${config.instagramUserId}/media`, {
    method: 'POST',
    token: config.accessToken,
    body: createPayload,
  });
  if (!create.ok || !create.data?.id) {
    await params.supabase.from('meta_page_posts').insert({
      campaign_id: params.campaignId,
      platform: 'instagram',
      instagram_user_id: config.instagramUserId,
      post_text: params.caption,
      media_url: params.mediaUrl,
      status: 'failed',
      error_message: create.error ?? 'Instagram media container failed',
      raw_response_json: create.data || {},
    });
    return { ...create, post: null };
  }

  const publish = await metaGraphFetch<{ id?: string }>(`${config.instagramUserId}/media_publish`, {
    method: 'POST',
    token: config.accessToken,
    body: { creation_id: create.data.id },
  });

  const now = new Date().toISOString();
  const { data, error } = await params.supabase.from('meta_page_posts').insert({
    campaign_id: params.campaignId,
    platform: 'instagram',
    instagram_user_id: config.instagramUserId,
    meta_media_id: publish.data?.id ?? create.data.id,
    post_text: params.caption,
    media_url: params.mediaUrl,
    published_at: publish.ok ? now : null,
    status: publish.ok ? 'published' : 'failed',
    error_message: publish.error ?? null,
    raw_response_json: { create: create.data || {}, publish: publish.data || {} },
  }).select('*').single();
  if (error) throw new Error(error.message);

  await params.supabase.from('campaign_events').insert({
    campaign_id: params.campaignId,
    event_type: publish.ok ? 'instagram_media_published' : 'instagram_media_failed',
    event_source: 'instagram_graph_api',
    event_data_json: {
      meta_media_id: publish.data?.id ?? create.data.id,
      error: publish.error ?? null,
    },
    occurred_at: now,
  });

  return { ...publish, post: data };
}

export async function syncPostEngagement(params: {
  supabase: SupabaseLike;
  campaignId?: string | null;
  metaPostId: string;
}) {
  const config = getMetaConfig();
  const result = await metaGraphFetch<any>(params.metaPostId, {
    token: config.pageAccessToken || config.accessToken,
    query: {
      fields: 'permalink_url,comments.limit(100){id,message,from,created_time},reactions.limit(100){id,name,type}',
    },
  });
  if (!result.ok) return result;

  const rows = [
    ...((result.data?.comments?.data || []) as any[]).map((comment) => ({
      campaign_id: params.campaignId ?? null,
      meta_post_id: params.metaPostId,
      engagement_type: 'comment',
      meta_user_id: comment.from?.id ?? null,
      user_name: comment.from?.name ?? null,
      comment_id: comment.id ?? null,
      comment_text: comment.message ?? null,
      raw_payload_json: comment,
      occurred_at: comment.created_time ? new Date(comment.created_time).toISOString() : new Date().toISOString(),
    })),
    ...((result.data?.reactions?.data || []) as any[]).map((reaction) => ({
      campaign_id: params.campaignId ?? null,
      meta_post_id: params.metaPostId,
      engagement_type: 'reaction',
      meta_user_id: reaction.id ?? null,
      user_name: reaction.name ?? null,
      raw_payload_json: reaction,
      occurred_at: new Date().toISOString(),
    })),
  ];

  if (rows.length) {
    await params.supabase
      .from('post_engagement_events')
      .upsert(rows, { onConflict: 'meta_post_id,engagement_type,comment_id', ignoreDuplicates: true });
  }

  if (result.data?.permalink_url) {
    await params.supabase
      .from('meta_page_posts')
      .update({ permalink_url: result.data.permalink_url })
      .eq('meta_post_id', params.metaPostId);
  }

  return { ...result, synced: rows.length };
}
