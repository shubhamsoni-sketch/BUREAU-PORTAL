import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';

const BUCKET = 'partner-agreements';

async function signedUrl(supabase: any, path: string | null) {
  if (!path) return null;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 30);
  return data?.signedUrl ?? null;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { data: agreements, error } = await auth.supabase
      .from('partner_agreements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const partnerIds = [...new Set((agreements ?? []).map((a: any) => a.partner_id).filter(Boolean))];
    const { data: partners } = partnerIds.length
      ? await auth.supabase
          .from('partners')
          .select('id, name, partner_code, email')
          .in('id', partnerIds)
      : { data: [] };

    const partnerMap = new Map((partners ?? []).map((p: any) => [p.id, p]));
    const data = await Promise.all((agreements ?? []).map(async (agreement: any) => {
      const partner = partnerMap.get(agreement.partner_id);
      return {
        ...agreement,
        partner_name: partner?.name ?? 'Unknown Partner',
        partner_code: partner?.partner_code ?? '',
        partner_email: partner?.email ?? '',
        signed_url: await signedUrl(auth.supabase, agreement.file_path),
      };
    }));

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
