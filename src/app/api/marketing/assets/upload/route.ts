import { NextRequest, NextResponse } from 'next/server';
import { clean, jsonError, requireMarketingAdmin } from '@/lib/marketing/api';

const BUCKET = 'marketing-assets';
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
}

async function ensureBucket(supabase: any) {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(error.message);
  if (buckets?.some((bucket: any) => bucket.name === BUCKET)) return;

  const { error: createError } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_FILE_SIZE,
    allowedMimeTypes: ALLOWED_TYPES,
  });
  if (createError) throw new Error(createError.message);
}

export async function POST(request: NextRequest) {
  const { auth, response } = await requireMarketingAdmin(request);
  if (response) return response;

  try {
    const form = await request.formData();
    const campaignId = clean(form.get('campaign_id'));
    const caption = clean(form.get('caption'));
    const file = form.get('file');
    if (!(file instanceof File)) return jsonError('Media file is required.');
    if (!ALLOWED_TYPES.includes(file.type)) return jsonError('Only JPG, PNG, WebP, MP4 or MOV media is allowed.');
    if (file.size > MAX_FILE_SIZE) return jsonError('Media file must be 25 MB or smaller.');

    await ensureBucket(auth.supabase);

    const assetType = file.type.startsWith('video/') ? 'video' : 'image';
    const filePath = `${campaignId || 'draft'}/${Date.now()}-${safeFileName(file.name || 'asset')}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await auth.supabase.storage.from(BUCKET).upload(filePath, bytes, {
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) throw new Error(uploadError.message);

    const { data: publicUrl } = auth.supabase.storage.from(BUCKET).getPublicUrl(filePath);
    let asset = null;
    if (campaignId) {
      const result = await auth.supabase.from('marketing_assets').insert({
        campaign_id: campaignId,
        asset_type: assetType,
        file_url: publicUrl.publicUrl,
        storage_path: filePath,
        mime_type: file.type,
        file_size: file.size,
        caption: caption || null,
      }).select('*').single();
      if (result.error) throw new Error(result.error.message);
      asset = result.data;
    }

    return NextResponse.json({
      success: true,
      asset,
      file_url: publicUrl.publicUrl,
      asset_type: assetType,
      storage_path: filePath,
    });
  } catch (error) {
    console.error('[marketing/assets/upload] error:', error);
    return jsonError(error instanceof Error ? error.message : 'Unable to upload marketing asset', 500);
  }
}
