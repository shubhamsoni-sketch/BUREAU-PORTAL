import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const DEMO_STORE_MOBILE = '0000000001';
const DEMO_STORE_STATUS = 'crm_store';

function cleanString(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function bearerToken(request: NextRequest) {
  const header = request.headers.get('authorization') || '';
  return header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
}

export type CrmScope = {
  partnerId: string | null;
  userId: string | null;
  userEmail: string | null;
  isPartnerOwner: boolean;
  storeMobile: string;
  storeStatus: string;
  storeName: string;
  isDemo: boolean;
};

export async function resolveCrmScope(
  request: NextRequest,
  supabase: ReturnType<typeof createAdminClient>
): Promise<CrmScope> {
  const token = bearerToken(request);
  let userId = cleanString(request.headers.get('x-crm-user-id') || request.nextUrl.searchParams.get('user_id'));
  let userEmail = '';
  let metadataPartnerId = '';

  if (token) {
    const { data } = await supabase.auth.getUser(token);
    const user = data.user;
    userId = user?.id || userId;
    userEmail = user?.email || '';
    metadataPartnerId = cleanString(
      user?.app_metadata?.crm_partner_id ||
        user?.app_metadata?.partner_id ||
        user?.user_metadata?.crm_partner_id ||
        user?.user_metadata?.partner_id
    );
  }

  const requestedPartnerId = cleanString(
    request.headers.get('x-crm-partner-id') ||
      request.nextUrl.searchParams.get('partner_id') ||
      metadataPartnerId
  );

  let partner: { id: string; user_id?: string | null; partner_code?: string | null; company_name?: string | null; name?: string | null } | null = null;

  if (requestedPartnerId) {
    const { data, error } = await supabase
      .from('partners')
      .select('id, user_id, partner_code, company_name, name')
      .eq('id', requestedPartnerId)
      .maybeSingle();
    if (error) throw error;
    partner = data;
  } else if (userId) {
    const { data, error } = await supabase
      .from('partners')
      .select('id, user_id, partner_code, company_name, name')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    partner = data;
  }

  if (!partner) {
    return {
      partnerId: null,
      userId: userId || null,
      userEmail: userEmail || null,
      isPartnerOwner: false,
      storeMobile: DEMO_STORE_MOBILE,
      storeStatus: DEMO_STORE_STATUS,
      storeName: 'DSA CRM Store',
      isDemo: true,
    };
  }

  return {
    partnerId: partner.id,
    userId: userId || null,
    userEmail: userEmail || null,
    isPartnerOwner: Boolean(userId && partner.user_id === userId),
    storeMobile: `crm:${partner.id}`,
    storeStatus: `${DEMO_STORE_STATUS}:${partner.id}`,
    storeName: `${partner.company_name || partner.name || partner.partner_code || 'Partner'} CRM Store`,
    isDemo: false,
  };
}
