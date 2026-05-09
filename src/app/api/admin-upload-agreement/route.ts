import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';

const BUCKET = 'partner-agreements';

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
}

async function ensureBucket(supabase: any) {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(error.message);
  if (buckets?.some((bucket: any) => bucket.name === BUCKET)) return;

  const { error: createError } = await supabase.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  });
  if (createError) throw new Error(createError.message);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const form = await request.formData();
    const partnerId = String(form.get('partnerId') || '');
    const agreementName = String(form.get('agreementName') || '').trim();
    const file = form.get('file');

    if (!partnerId || !agreementName || !(file instanceof File)) {
      return NextResponse.json({ error: 'partnerId, agreementName and file are required' }, { status: 400 });
    }

    const { data: partner, error: partnerError } = await auth.supabase
      .from('partners')
      .select('id, user_id')
      .eq('id', partnerId)
      .maybeSingle();

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    await ensureBucket(auth.supabase);

    const filePath = `${partnerId}/${Date.now()}-${safeFileName(file.name || 'agreement.pdf')}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await auth.supabase.storage
      .from(BUCKET)
      .upload(filePath, bytes, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    const { data, error } = await auth.supabase
      .from('partner_agreements')
      .insert({
        partner_id: partner.id,
        user_id: partner.user_id,
        agreement_name: agreementName,
        file_path: filePath,
        status: 'pending',
        assigned_by: auth.user.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
