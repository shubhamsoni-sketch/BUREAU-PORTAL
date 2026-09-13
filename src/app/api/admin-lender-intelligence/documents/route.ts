import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';
import { logLenderIntelligenceAudit } from '@/lib/lender-intelligence/audit';
import { hasValidLenderDocumentSignature } from '@/lib/lender-intelligence/document-signature';
import { requireLenderIntelligenceCapability } from '@/lib/lender-intelligence/access';

export const runtime = 'nodejs';

const BUCKET = 'lender-policy-documents';
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

function safeName(name: string) {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(-120);
}

async function ensurePrivateBucket(supabase: SupabaseClient) {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  if (data?.some((bucket: { name: string }) => bucket.name === BUCKET)) return;
  const { error: createError } = await supabase.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: MAX_SIZE,
    allowedMimeTypes: [...ALLOWED_TYPES],
  });
  if (createError) throw createError;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if ('error' in auth)
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  const denied = requireLenderIntelligenceCapability(auth.user, 'compliance.read');
  if (denied)
    return NextResponse.json({ success: false, error: denied.error }, { status: denied.status });
  const id = request.nextUrl.searchParams.get('id');
  if (!id)
    return NextResponse.json({ success: false, error: 'Document is required' }, { status: 400 });
  const { data: document, error } = await auth.supabase
    .from('lender_policy_documents')
    .select(
      'id,lender_id,program_id,policy_version_id,file_name,storage_path,lender_master(partner_id)'
    )
    .eq('id', id)
    .single();
  if (error)
    return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
  const { data, error: signedError } = await auth.supabase.storage
    .from(BUCKET)
    .createSignedUrl(document.storage_path, 300);
  if (signedError)
    return NextResponse.json({ success: false, error: signedError.message }, { status: 500 });
  const lender = Array.isArray(document.lender_master)
    ? document.lender_master[0]
    : document.lender_master;
  try {
    await logLenderIntelligenceAudit(auth.supabase, auth.user, {
      partnerId: lender?.partner_id || null,
      module: 'compliance',
      action: 'access_document',
      entityType: 'policy_document',
      entityId: document.id,
      summary: `${document.file_name} private document access granted`,
      metadata: {
        lenderId: document.lender_id,
        programId: document.program_id,
        policyVersionId: document.policy_version_id,
        signedUrlTtlSeconds: 300,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Document access could not be audited' },
      { status: 503 }
    );
  }
  return NextResponse.json({
    success: true,
    data: {
      id: document.id,
      fileName: document.file_name,
      signedUrl: data.signedUrl,
      expiresIn: 300,
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if ('error' in auth)
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  const denied = requireLenderIntelligenceCapability(auth.user, 'policy.manage');
  if (denied)
    return NextResponse.json({ success: false, error: denied.error }, { status: denied.status });
  try {
    const form = await request.formData();
    const lenderId = String(form.get('lenderId') || '');
    const programId = String(form.get('programId') || '') || null;
    const policyVersionId = String(form.get('policyVersionId') || '') || null;
    const documentType = String(form.get('documentType') || '').trim();
    const expiresAt = String(form.get('expiresAt') || '') || null;
    const file = form.get('file');
    if (!lenderId || !documentType || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'Lender, document type, and file are required' },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.has(file.type))
      return NextResponse.json(
        { success: false, error: 'Only PDF, Word, and Excel policy documents are allowed' },
        { status: 415 }
      );
    if (!file.size || file.size > MAX_SIZE)
      return NextResponse.json(
        { success: false, error: 'Document must be between 1 byte and 10 MB' },
        { status: 413 }
      );

    const { data: lender, error: lenderError } = await auth.supabase
      .from('lender_master')
      .select('id')
      .eq('id', lenderId)
      .single();
    if (lenderError || !lender)
      return NextResponse.json({ success: false, error: 'Lender not found' }, { status: 404 });
    if (programId) {
      const { data: program, error: programError } = await auth.supabase
        .from('lender_programs')
        .select('id')
        .eq('id', programId)
        .eq('lender_id', lenderId)
        .maybeSingle();
      if (programError || !program)
        return NextResponse.json(
          { success: false, error: 'Program does not belong to the selected lender' },
          { status: 409 }
        );
    }
    if (policyVersionId) {
      const { data: policy, error: policyError } = await auth.supabase
        .from('lender_policy_versions')
        .select('id,program_id,lender_programs!inner(lender_id)')
        .eq('id', policyVersionId)
        .maybeSingle();
      const policyProgram = policy
        ? Array.isArray(policy.lender_programs)
          ? policy.lender_programs[0]
          : policy.lender_programs
        : null;
      if (
        policyError ||
        !policy ||
        policyProgram?.lender_id !== lenderId ||
        (programId && policy.program_id !== programId)
      ) {
        return NextResponse.json(
          {
            success: false,
            error: 'Policy version does not belong to the selected lender and program',
          },
          { status: 409 }
        );
      }
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!hasValidLenderDocumentSignature(bytes, file.type)) {
      return NextResponse.json(
        { success: false, error: 'File contents do not match the declared document type' },
        { status: 415 }
      );
    }
    const checksum = createHash('sha256').update(bytes).digest('hex');
    await ensurePrivateBucket(auth.supabase);
    const storagePath = `${lenderId}/${new Date().getUTCFullYear()}/${crypto.randomUUID()}-${safeName(file.name || 'policy-document')}`;
    const { error: uploadError } = await auth.supabase.storage
      .from(BUCKET)
      .upload(storagePath, bytes, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;

    const { data: result, error } = await auth.supabase.rpc('register_lender_policy_document', {
      p_lender_id: lenderId,
      p_program_id: programId,
      p_policy_version_id: policyVersionId,
      p_document_type: documentType,
      p_file_name: safeName(file.name),
      p_storage_path: storagePath,
      p_mime_type: file.type,
      p_checksum: checksum,
      p_expires_at: expiresAt,
      p_user_id: auth.user.id,
    });
    if (error) {
      await auth.supabase.storage.from(BUCKET).remove([storagePath]);
      throw error;
    }
    const data = Array.isArray(result) ? result[0] : result;
    return NextResponse.json({ success: true, data: { ...data, storage_path: undefined } });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unable to upload document',
      },
      { status: 500 }
    );
  }
}
