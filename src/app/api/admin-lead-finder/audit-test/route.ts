import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';
import { checkLeadFinderTables } from '@/lib/lead-finder/db';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if ('error' in auth)
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  const ready = await checkLeadFinderTables(auth.supabase);
  if (!ready.ready)
    return NextResponse.json({ success: false, error: ready.warning }, { status: 400 });

  const base = new URL(request.url);
  const body = {
    city: 'Indore',
    state: 'Madhya Pradesh',
    count: 20,
    keywords: ['Loan Agent'],
    forceRefresh: false,
    refreshExisting: false,
  };
  const headers = {
    authorization: request.headers.get('authorization') || '',
    'content-type': 'application/json',
  };
  const first = await fetch(new URL('/api/admin-lead-finder/search', base.origin), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  }).then((res) => res.json());
  const second = await fetch(new URL('/api/admin-lead-finder/search', base.origin), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  }).then((res) => res.json());
  const passed =
    Number(second?.summary?.textSearchCalls || 0) === 0 &&
    Number(second?.summary?.placeDetailsCalls || 0) === 0;
  return NextResponse.json(
    {
      success: passed,
      firstRun: first.summary,
      secondRun: second.summary,
      expected: { textSearchCalls: 0, placeDetailsCalls: 0 },
    },
    { status: passed ? 200 : 500 }
  );
}
