import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { getApiHubStore, hitMasterApi, saveApiHubStore, validateClientIp } from '@/lib/api-hub/simple-store';
import { hashApiKey, maskMobile, maskPan } from '@/lib/api-hub/keys';
import { appendApiUsageLedger, requestEvidence } from '@/lib/api-hub/usage-ledger';
import { archiveApiHubBureauPull } from '@/lib/api-hub/bureau-pull-archive';
import { getStateName, STATE_NAME_BY_CODE } from '@/lib/bureau/state-codes';
import { normalizeBintaProductionResponse } from '@/lib/api-hub/binta-production-normalizer';
import { verifyBintaMtlsAttestation } from '@/lib/api-hub/binta-mtls-attestation';
import {
  completeBintaLiveRequest,
  failBintaLiveRequest,
  getBintaLiveBalance,
  reserveBintaLiveRequest,
} from '@/lib/api-hub/binta-live-ledger';
import bintaUatNormalizedResponse from '@/lib/api-hub/binta-uat-normalized-response.json';

type JaadugarCibilPayload = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  pan: string;
  mobile: string;
  address: string;
  state: string;
  pincode: string;
};

const PORTAL_DEFAULTS = {
  dob: '2000-01-01',
  gender: 'male',
  address: 'CreditTrust Verified Address',
  state: 'MADHYA PRADESH',
  pincode: '452001',
};

function jsonError(message: string, status = 400, requestId?: string) {
  return NextResponse.json({ success: false, request_id: requestId, error: message }, { status });
}

function cleanString(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function digits(value: unknown) {
  return cleanString(value).replace(/\D/g, '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function collectValues(value: unknown, aliases: string[], found: string[] = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectValues(item, aliases, found));
    return found;
  }
  if (!isRecord(value)) return found;
  for (const [key, nested] of Object.entries(value)) {
    if (aliases.some((alias) => alias.toLowerCase() === key.toLowerCase())) {
      const text = cleanString(nested);
      if (text) found.push(text);
    }
    collectValues(nested, aliases, found);
  }
  return found;
}

function firstValue(value: unknown, aliases: string[]) {
  return collectValues(value, aliases)[0] || '';
}

function asNumber(value: unknown) {
  const text = cleanString(value).replace(/,/g, '');
  const number = Number(text);
  return Number.isFinite(number) ? number : 0;
}

function scoreRange(rawScore: string) {
  const score = Number(rawScore);
  if (!Number.isFinite(score)) return { available: false, score_range: 'not_available', score_band: 'unknown' };
  if (score === -1) return { available: false, score_range: '-1', score_band: 'no-hit' };
  const lower = Math.floor(score / 5) * 5;
  const upper = lower + 5;
  const band = score >= 750 ? 'excellent' : score >= 700 ? 'good' : score >= 650 ? 'fair' : score >= 600 ? 'weak' : 'poor';
  return { available: true, score_range: `${lower}-${upper}`, score_band: band };
}

function dateToIso(value: unknown) {
  const text = cleanString(value);
  const ddmmyyyy = text.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
  const yyyymmdd = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yyyymmdd) return text;
  return text || null;
}

function bintaMaskPan(value?: string | null) {
  const pan = (value ?? '').toUpperCase();
  if (pan.length < 6) return pan ? '***' : '';
  return `${pan.slice(0, 5)}****${pan.slice(-1)}`;
}

function bintaMaskMobile(value?: string | null) {
  const mobile = value ?? '';
  if (mobile.length < 4) return mobile ? '******' : '';
  return `${mobile.slice(0, 2)}******${mobile.slice(-2)}`;
}

function firstNumber(value: unknown, aliases: string[]) {
  return asNumber(firstValue(value, aliases));
}

function firstDate(value: unknown, aliases: string[]) {
  return dateToIso(firstValue(value, aliases));
}

function amountOrNull(value: unknown) {
  const text = cleanString(value);
  if (!text) return null;
  return asNumber(text);
}

function collectTradelineCandidates(value: unknown, found: Record<string, unknown>[] = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectTradelineCandidates(item, found));
    return found;
  }
  if (!isRecord(value)) return found;
  const keys = Object.keys(value).map((key) => key.toLowerCase());
  const looksLikeAccount = keys.some((key) => ['accounttype', 'account_type', 'loantype', 'loan_type', 'currentbalance', 'current_balance', 'amountoverdue', 'amount_overdue'].includes(key));
  if (looksLikeAccount) found.push(value);
  Object.values(value).forEach((nested) => collectTradelineCandidates(nested, found));
  return found;
}

function normalizeBureauStandardResponse(params: {
  requestId: string;
  environment: string;
  requestBody: Record<string, unknown>;
  payload: JaadugarCibilPayload;
  responseData: unknown;
}) {
  const { requestId, environment, requestBody, payload, responseData } = params;
  const rawScore = firstValue(responseData, ['score', 'bureauScore', 'cibilScore', 'creditScore']) || firstValue(requestBody, ['score']);
  const tradelines = collectTradelineCandidates(responseData).slice(0, 50).map((account) => {
    const currentBalance = asNumber(account.currentBalance ?? account.current_balance ?? account.balance ?? account.balanceAmount);
    const overdue = asNumber(account.amountOverdue ?? account.amount_overdue ?? account.overdueAmount ?? account.overdue);
    const dpd = cleanString(account.dpd ?? account.dpdBucket ?? account.dpd_bucket ?? account.daysPastDue ?? account.paymentStatus) || '0';
    return {
      loan_type: cleanString(account.accountType ?? account.account_type ?? account.loanType ?? account.loan_type) || 'Not disclosed',
      account_status: cleanString(account.accountStatus ?? account.account_status ?? account.status) || 'Not disclosed',
      current_balance: currentBalance,
      dpd_bucket: dpd,
      delinquency_indicator: overdue > 0 || (dpd !== '0' && dpd !== '000' && dpd !== '-'),
    };
  });
  const activeAccounts = tradelines.filter((item) => item.account_status.toLowerCase().includes('active')).length;
  const totalCurrentBalance = tradelines.reduce((sum, item) => sum + item.current_balance, 0);

  return {
    success: true,
    request_id: requestId,
    environment,
    status: 'completed',
    source: 'CREDIT_SOURCE',
    score: scoreRange(rawScore),
    consumer: {
      first_name: payload.firstName,
      last_name: payload.lastName,
      dob: payload.dob,
      mobile_masked: maskMobile(payload.mobile),
      pan_masked: maskPan(payload.pan),
    },
    summary: {
      total_accounts: tradelines.length,
      active_accounts: activeAccounts,
      closed_accounts: Math.max(0, tradelines.length - activeAccounts),
      total_current_balance: totalCurrentBalance,
      total_overdue_balance: tradelines.reduce((sum, item) => sum + (item.delinquency_indicator ? item.current_balance : 0), 0),
      recent_enquiries_6_months: asNumber(firstValue(responseData, ['recentEnquiries6Months', 'recent_enquiries_6_months', 'enquiryCount'])),
    },
    tradelines,
    consent: {
      validated: Boolean(requestBody.consent ?? requestBody.consent_given ?? true),
      consent_timestamp: consentTimestamp(requestBody),
    },
    generated_at: new Date().toISOString(),
  };
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function buildBintaUatNormalizedResponse(params: {
  requestId: string;
  environment: string;
  responseTimeMs: number;
  requestBody: Record<string, unknown>;
  payload: JaadugarCibilPayload;
}) {
  const { requestId, environment, responseTimeMs, requestBody, payload } = params;
  const fixture = cloneJson(bintaUatNormalizedResponse) as Record<string, any>;
  const consent = consentSource(requestBody);
  const stateCode = cleanString(requestBody.state_code || requestBody.stateCode);
  const stateName = payload.state || (stateCode ? STATE_NAME_BY_CODE[stateCode.padStart(2, '0')] : '') || '';

  fixture.request_id = requestId;
  fixture.environment = environment;
  fixture.processing = {
    ...(fixture.processing || {}),
    response_time_ms: responseTimeMs,
    generated_at: new Date().toISOString(),
    source_raw_json_included: false,
    normalization_policy: 'schedule_a_normalized_bureau_report',
  };
  fixture.consent = {
    ...(fixture.consent || {}),
    validated: true,
    consent_timestamp: consentTimestamp(requestBody),
    consent_reference: cleanString(consent.consent_reference || consent.consentReference || requestBody.consent_reference || requestBody.consentReference) || fixture.consent?.consent_reference || null,
  };
  fixture.input = {
    ...(fixture.input || {}),
    identity: {
      ...(fixture.input?.identity || {}),
      first_name: payload.firstName,
      middle_name: cleanString(requestBody.middleName || requestBody.middle_name).toUpperCase(),
      last_name: payload.lastName,
      dob: dateToIso(payload.dob),
      gender: payload.gender,
      pan_masked: bintaMaskPan(payload.pan),
      mobile_masked: bintaMaskMobile(payload.mobile),
    },
  };
  fixture.identities = [{ type: 'PAN', id_masked: bintaMaskPan(payload.pan) }];
  fixture.contacts = {
    ...(fixture.contacts || {}),
    mobiles: [{ mobile_masked: bintaMaskMobile(payload.mobile), type: 'mobile' }],
    emails: cleanString(consent.email || requestBody.email)
      ? [{ email_masked: cleanString(consent.email || requestBody.email).replace(/^(.{2}).*(@.*)$/, '$1***$2') }]
      : fixture.contacts?.emails || [],
  };
  fixture.addresses = [
    {
      ...(Array.isArray(fixture.addresses) && fixture.addresses[0] ? fixture.addresses[0] : {}),
      sequence: 1,
      address_line_1: payload.address.toUpperCase(),
      state_code: stateCode || null,
      state: stateName,
      pincode: payload.pincode,
      address_category: 'residence',
    },
    ...(Array.isArray(fixture.addresses) ? fixture.addresses.slice(1) : []),
  ];

  return fixture;
}

function shouldReturnCreditTrustStandard(metadata: unknown) {
  if (!isRecord(metadata)) return false;
  const response = isRecord(metadata.response) ? metadata.response : {};
  const mode = cleanString(
    metadata.response_mode
    || metadata.responseMode
    || metadata.delivery_mode
    || response.mode,
  ).toLowerCase();
  return ['credittrust_standard', 'binta_standard', 'normalized'].includes(mode);
}

function isBintaClient(client: { name?: unknown; company_name?: unknown; metadata?: unknown }) {
  const metadata = isRecord(client.metadata) ? client.metadata : {};
  const legal = isRecord(metadata.legal) ? metadata.legal : {};
  const scope = cleanString(metadata.bridge_console_scope || metadata.console_scope).toLowerCase();
  const identity = [
    client.name,
    client.company_name,
    legal.legal_entity_name,
  ].map(cleanString).join(' ').toLowerCase();

  return scope === 'binta_bridge' || identity.includes('binta financial');
}

function clientEnvironment(metadata: unknown, keyEnvironment?: string) {
  const keyEnv = cleanString(keyEnvironment).toLowerCase();
  if (keyEnv === 'uat') return 'uat';
  if (keyEnv === 'production' || keyEnv === 'live') return 'production';
  if (!isRecord(metadata)) return 'production';
  const environment = cleanString(metadata.environment || metadata.env).toLowerCase();
  return environment === 'uat' ? 'uat' : 'production';
}

function splitName(value: unknown) {
  const parts = cleanString(value).toUpperCase().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.length > 1 ? parts[parts.length - 1] : '',
  };
}

function normalizeGender(value: unknown) {
  const gender = cleanString(value).toLowerCase();
  if (['1', '01', 'f', 'female'].includes(gender)) return 'female';
  if (['2', '02', 'm', 'male'].includes(gender)) return 'male';
  if (['3', '03', 't', 'transgender'].includes(gender)) return 'transgender';
  return gender;
}

function normalizeState(value: unknown) {
  const state = cleanString(value);
  if (!state) return '';
  if (/^\d{1,2}$/.test(state)) return STATE_NAME_BY_CODE[state.padStart(2, '0')] || '';
  const normalizedState = getStateName(state);
  return Object.values(STATE_NAME_BY_CODE).includes(normalizedState) ? normalizedState : '';
}

function normalizePayload(body: Record<string, unknown>, options: { useLegacyDefaults?: boolean } = {}): JaadugarCibilPayload {
  const fullName = splitName(body.name || body.fullName || body.customerName);
  const rawGender = body.gender_code || body.genderCode || body.gender || body.sex;
  const rawState = body.state_code || body.stateCode || body.state || body.stateName || body.state_name;
  const useLegacyDefaults = Boolean(options.useLegacyDefaults);
  return {
    firstName: cleanString(body.firstName || body.first_name).toUpperCase() || fullName.firstName,
    lastName: cleanString(body.lastName || body.last_name).toUpperCase() || fullName.lastName,
    dob: cleanString(body.dob || body.birthDate || body.dateOfBirth || body.date_of_birth) || (useLegacyDefaults ? PORTAL_DEFAULTS.dob : ''),
    gender: normalizeGender(rawGender) || (useLegacyDefaults ? PORTAL_DEFAULTS.gender : ''),
    pan: cleanString(body.pan || body.idNumber).toUpperCase(),
    mobile: digits(body.mobile || body.telephoneNumber || body.mobile_number || body.mobileNumber).slice(-10),
    address: cleanString(body.address || body.detailed_address || body.detailedAddress) || (useLegacyDefaults ? PORTAL_DEFAULTS.address : ''),
    state: normalizeState(rawState) || (useLegacyDefaults ? PORTAL_DEFAULTS.state : ''),
    pincode: digits(body.pincode || body.pinCode || body.pin_code).slice(0, 6) || (useLegacyDefaults ? PORTAL_DEFAULTS.pincode : ''),
  };
}

function validatePayload(payload: JaadugarCibilPayload, options: { requireFullPayload?: boolean } = {}) {
  const required: Array<keyof JaadugarCibilPayload> = options.requireFullPayload
    ? ['firstName', 'lastName', 'dob', 'gender', 'pan', 'mobile', 'address', 'state', 'pincode']
    : ['firstName', 'lastName', 'pan', 'mobile'];
  const missing = required.filter((field) => !payload[field]);
  if (missing.includes('firstName') || missing.includes('lastName')) return 'name must include first and last name';
  if (missing.length) return `Missing required fields: ${missing.join(', ')}`;
  if (options.requireFullPayload) {
    const dob = payload.dob.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!dob) return 'dob must be DD-MM-YYYY';
    const day = Number(dob[1]);
    const month = Number(dob[2]);
    const year = Number(dob[3]);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() + 1 !== month || parsed.getUTCDate() !== day) {
      return 'dob must be a valid DD-MM-YYYY date';
    }
  }
  if (options.requireFullPayload && !['male', 'female', 'transgender'].includes(payload.gender.toLowerCase())) return 'gender must be male, female, or transgender';
  if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(payload.pan)) return 'pan must be a valid PAN format';
  if (!/^\d{10}$/.test(payload.mobile)) return 'mobile must be 10 digits';
  if (options.requireFullPayload && !/^\d{6}$/.test(payload.pincode)) return 'pincode must be 6 digits';
  return null;
}

function consentSource(body: Record<string, unknown>) {
  const nested = body.consent_metadata || body.consentMeta || body.consent;
  return isRecord(nested) ? nested : body;
}

function consentTimestamp(body: Record<string, unknown>) {
  const source = consentSource(body);
  return cleanString(
    source.consent_timestamp
    || source.consentTimestamp
    || source.consent_timespamp
    || source.consentTime,
  );
}

function validateConsent(body: Record<string, unknown>) {
  const source = consentSource(body);
  const consentValue = body.consent_given ?? body.consentGiven ?? body.consent ?? source.consent_given ?? source.consentGiven;
  const hasConsentFlag = consentValue === true || String(consentValue).toLowerCase() === 'true' || String(consentValue).toUpperCase() === 'Y';
  if (!hasConsentFlag) return 'consent must be true';
  if (!consentTimestamp(body)) return 'consent_timestamp is required';
  return null;
}

export async function POST(request: NextRequest) {
  const requestId = `API-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const startedAt = Date.now();

  try {
    const apiKey = request.headers.get('x-api-key')?.trim();
    if (!apiKey) return jsonError('x-api-key header is required', 401, requestId);

    const supabase = createAdminClient();
    const { rowId, store } = await getApiHubStore(supabase);
    const keyRecord = store.keys.find((key) => key.key_hash === hashApiKey(apiKey) && key.status === 'active');
    if (!keyRecord) return jsonError('Invalid or inactive API key', 401, requestId);

    const client = store.clients.find((item) => item.id === keyRecord.client_id && item.status === 'active');
    const api = store.apis.find((item) => item.id === keyRecord.api_id && item.status === 'active');
    if (!client) return jsonError('Client is not active', 403, requestId);
    if (!api) return jsonError('API is not active', 403, requestId);
    if (!['bureau', 'bureau-standard', 'cibil.consumer_score'].includes(api.code)) {
      return jsonError('API key is not allowed for Bureau API Standard', 403, requestId);
    }
    const isBintaBureauRequest = request.headers.get('x-credittrust-bureau-mode') === 'binta'
      || request.nextUrl.pathname.includes('/bureau-binta');
    const isBintaContractClient = isBintaClient(client);
    if (isBintaBureauRequest && !isBintaContractClient) {
      return jsonError('API key is not allowed for Binta Bureau API', 403, requestId);
    }

    // Binta has already received docs for /api/v1/source, so keep that endpoint
    // compatible while still enforcing the dedicated normalized response contract.
    const usesBintaContract = isBintaBureauRequest || isBintaContractClient;
    if (usesBintaContract && !['uat', 'production'].includes(cleanString(keyRecord.environment))) {
      return jsonError('Binta API key environment must be explicit', 403, requestId);
    }
    const environment = clientEnvironment(client.metadata, keyRecord.environment);
    const bintaProduction = usesBintaContract && environment === 'production';
    const metadata = isRecord(client.metadata) ? client.metadata : {};
    const security = isRecord(metadata.security) ? metadata.security : {};
    const onboarding = isRecord(metadata.onboarding) ? metadata.onboarding : {};
    const productionIps = Array.isArray(security.production_static_ips)
      ? security.production_static_ips.map(cleanString).filter(Boolean)
      : [];

    if (bintaProduction) {
      if (process.env.BINTA_PRODUCTION_ENABLED !== 'true') return jsonError('Binta production is not enabled', 503, requestId);
      if (!productionIps.length || onboarding.uatSignoffStatus !== 'done'
        || onboarding.payloadValidationStatus !== 'done' || onboarding.productionIpStatus !== 'done'
        || onboarding.productionCertificateStatus !== 'done'
        || onboarding.goLiveStatus !== 'done') {
        return jsonError('Binta production onboarding is incomplete', 503, requestId);
      }
    } else {
      const ipError = validateClientIp(client, request);
      if (ipError) return jsonError(ipError.message, 403, requestId);
    }

    const rawBody = bintaProduction ? await request.clone().text() : '';
    let body: unknown = {};
    let invalidJson = false;
    try {
      body = await request.json();
    } catch {
      invalidJson = true;
    }
    if (bintaProduction && !verifyBintaMtlsAttestation({
      headers: request.headers,
      rawBody,
      expectedFingerprint: process.env.BINTA_PRODUCTION_CERT_SHA256 || '',
      secret: process.env.BINTA_MTLS_PROXY_SECRET || '',
      allowedIps: productionIps,
    })) {
      return jsonError('Client certificate or production IP verification failed', 403, requestId);
    }
    const requestBody = body && typeof body === 'object' && !Array.isArray(body)
      ? body as Record<string, unknown>
      : {};
    const requiresStandardResponse = usesBintaContract || shouldReturnCreditTrustStandard(client.metadata);
    const payload = normalizePayload(requestBody, { useLegacyDefaults: !requiresStandardResponse });
    const baseLog = {
      id: crypto.randomUUID(),
      request_id: requestId,
      client_id: client.id,
      api_id: api.id,
      key_id: keyRecord.id,
      masked_pan: maskPan(payload.pan),
      masked_mobile: maskMobile(payload.mobile),
      created_at: new Date().toISOString(),
    };
    const apiCode = usesBintaContract ? 'bureau-binta' : api.code;
    const liveBalance = bintaProduction ? await getBintaLiveBalance(supabase, client.id) : 0;
    const currentBalance = () => Number(bintaProduction ? liveBalance : client.credits || 0);

    async function saveFailure(message: string, status = 400, responseJson?: unknown, providerStatus?: number) {
      const responseTime = Date.now() - startedAt;
      if (!bintaProduction) {
        store.usage = [{
          ...baseLog,
          status: 'failed' as const,
          credits_deducted: 0,
          response_time_ms: responseTime,
          error_message: message,
        }, ...store.usage].slice(0, 200);
        await saveApiHubStore(supabase, rowId, store);
      }
      await appendApiUsageLedger(supabase, {
        ...baseLog,
        ...requestEvidence(request),
        api_code: apiCode,
        environment,
        status: 'failed',
        http_status: status,
        provider_status: providerStatus,
        credits_deducted: 0,
        balance_after: currentBalance(),
        response_time_ms: responseTime,
        error_message: message,
        request_json: requestBody,
        response_json: responseJson,
        metadata: { normalized_provider_payload: payload },
      });
      return jsonError(message, status, requestId);
    }

    if (invalidJson) return saveFailure('Request body must be valid JSON', 400);
    const cost = Math.max(1, Number(api.per_hit_credits || 1));
    // The production reservation RPC checks balance atomically and can replay
    // a completed idempotent request even after the wallet reaches zero.
    if (!bintaProduction && currentBalance() < cost) return saveFailure('Insufficient credits', 402);

    const validationError = validatePayload(payload, { requireFullPayload: requiresStandardResponse });
    if (validationError) return saveFailure(validationError, 400);
    if (requiresStandardResponse) {
      const consentError = validateConsent(requestBody);
      if (consentError) return saveFailure(consentError, 400);
    }

    if (bintaProduction) {
      const idempotencyKey = request.headers.get('idempotency-key')?.trim() || null;
      if (idempotencyKey && (idempotencyKey.length > 128 || !/^[\w.:-]+$/.test(idempotencyKey))) {
        return saveFailure('Invalid Idempotency-Key header', 400);
      }
      let reservation;
      try {
        reservation = await reserveBintaLiveRequest(supabase, {
          clientId: client.id,
          requestId,
          idempotencyKey,
          bodySha256: createHash('sha256').update(rawBody).digest('hex'),
          cost,
        });
      } catch (reservationError) {
        console.error('[api-hub:binta] live reservation failed:', reservationError);
        if (reservationError instanceof Error && reservationError.message.includes('Insufficient or unallocated live credits')) {
          return jsonError('Insufficient credits', 402, requestId);
        }
        return jsonError('Live request could not be reserved', 503, requestId);
      }
      if (reservation.status === 'success' && reservation.response) {
        return NextResponse.json(reservation.response);
      }
      if (reservation.request_id !== requestId || reservation.status !== 'reserved') {
        return jsonError('Request is already being processed or needs reconciliation', 409, reservation.request_id);
      }

      let sourceResponse: Awaited<ReturnType<typeof hitMasterApi>>;
      try {
        sourceResponse = await hitMasterApi(api, payload);
      } catch (sourceError) {
        // A timeout is ambiguous: the bureau may have processed the request.
        // Keep the reservation pending for operator reconciliation, not a blind retry.
        console.error('[api-hub:binta] source outcome unknown:', sourceError);
        return jsonError('Source outcome requires reconciliation', 503, requestId);
      }
      if (!sourceResponse.ok) {
        const message = `Source API failed with ${sourceResponse.status}`;
        try {
          await failBintaLiveRequest(supabase, {
            requestId, apiId: api.id, keyId: keyRecord.id,
            message, httpStatus: 502, providerStatus: sourceResponse.status,
          });
        } catch (refundError) {
          console.error('[api-hub:binta] live refund failed:', refundError);
          return jsonError('Source failure requires reconciliation', 503, requestId);
        }
        return jsonError(message, 502, requestId);
      }

      let outgoingResponse: unknown;
      try {
        outgoingResponse = normalizeBintaProductionResponse({
          requestId,
          responseTimeMs: Date.now() - startedAt,
          requestBody,
          payload,
          sourceResponse: sourceResponse.data,
        });
      } catch (normalizationError) {
        // Do not retry the live bureau call while its result is unarchived.
        console.error('[api-hub:binta] live normalization needs reconciliation:', normalizationError);
        return jsonError('Source response requires reconciliation', 503, requestId);
      }
      try {
        await completeBintaLiveRequest(supabase, {
          requestId,
          requestJson: requestBody,
          responseJson: outgoingResponse,
          apiId: api.id,
          keyId: keyRecord.id,
          maskedPan: maskPan(payload.pan),
          maskedMobile: maskMobile(payload.mobile),
          responseTimeMs: Date.now() - startedAt,
          ipAddress: request.headers.get('x-credittrust-mtls-source-ip') || '',
        });
      } catch (archiveError) {
        console.error('[api-hub:binta] live archive/finalization failed:', archiveError);
        return jsonError('Response archive requires reconciliation', 503, requestId);
      }
      return NextResponse.json(outgoingResponse);
    }

    if (usesBintaContract && environment === 'uat') {
      const responseTime = Date.now() - startedAt;
      const remainingCredits = Math.max(0, Number(client.credits || 0) - cost);
      const outgoingResponse = buildBintaUatNormalizedResponse({
        requestId,
        environment,
        responseTimeMs: responseTime,
        requestBody,
        payload,
      });

      store.clients = store.clients.map((item) => item.id === client.id
        ? {
          ...item,
          credits: remainingCredits,
          status: item.status,
          updated_at: new Date().toISOString(),
        }
        : item);
      store.keys = store.keys.map((key) => key.id === keyRecord.id ? { ...key, last_used_at: new Date().toISOString() } : key);
      store.usage = [{
        ...baseLog,
        status: 'success' as const,
        credits_deducted: cost,
        response_time_ms: responseTime,
      }, ...store.usage].slice(0, 200);

      await saveApiHubStore(supabase, rowId, store);
      await appendApiUsageLedger(supabase, {
        ...baseLog,
        ...requestEvidence(request),
        api_code: apiCode,
        environment,
        status: 'success',
        http_status: 200,
        provider_status: 200,
        credits_deducted: cost,
        balance_after: remainingCredits,
        response_time_ms: responseTime,
        request_json: requestBody,
        response_json: outgoingResponse,
        metadata: { normalized_provider_payload: payload, uat_fixture: 'binta-schedule-a-v1' },
      });

      try {
        await archiveApiHubBureauPull({
          supabase,
          client,
          api,
          requestId,
          requestBody,
          normalizedPayload: payload,
          responseJson: outgoingResponse,
          creditsDeducted: cost,
        });
      } catch (archiveError) {
        console.warn('[api-hub:cibil] Binta UAT bureau pull archive skipped:', archiveError);
      }

      return NextResponse.json(outgoingResponse);
    }

    const response = await hitMasterApi(api, payload);
    const responseTime = Date.now() - startedAt;

    if (!response.ok) {
      const message = typeof response.data === 'object' && response.data && 'error' in response.data
        ? String((response.data as { error: unknown }).error)
        : `Master API failed with ${response.status}`;
      store.usage = [{
        ...baseLog,
        status: 'failed' as const,
        credits_deducted: 0,
        response_time_ms: responseTime,
        error_message: message,
      }, ...store.usage].slice(0, 200);
      await saveApiHubStore(supabase, rowId, store);
      await appendApiUsageLedger(supabase, {
        ...baseLog,
        ...requestEvidence(request),
        api_code: api.code,
        status: 'failed',
        http_status: 502,
        provider_status: response.status,
        credits_deducted: 0,
        balance_after: currentBalance(),
        response_time_ms: responseTime,
        error_message: message,
        request_json: requestBody,
        response_json: response.data,
        metadata: { normalized_provider_payload: payload },
      });
      return jsonError(message, 502, requestId);
    }

    const outgoingResponse: unknown = requiresStandardResponse
      ? normalizeBureauStandardResponse({
          requestId,
          environment,
          requestBody,
          payload,
          responseData: response.data,
        })
      : {
          success: true,
          request_id: requestId,
          charged: { credits: cost, balance: Math.max(0, currentBalance() - cost) },
          access: currentBalance() - cost <= 0 ? 'inactive' : 'active',
          data: response.data,
        };

    const remainingCredits = Math.max(0, currentBalance() - cost);
    store.clients = store.clients.map((item) => item.id === client.id
      ? {
          ...item,
          credits: remainingCredits,
          status: remainingCredits === 0 ? 'inactive' : item.status,
          updated_at: new Date().toISOString(),
        }
      : item);
    store.keys = store.keys.map((key) => key.id === keyRecord.id ? { ...key, last_used_at: new Date().toISOString() } : key);
    store.usage = [{
      ...baseLog,
      status: 'success' as const,
      credits_deducted: cost,
      response_time_ms: responseTime,
    }, ...store.usage].slice(0, 200);
    await saveApiHubStore(supabase, rowId, store);
    await appendApiUsageLedger(supabase, {
      ...baseLog,
      ...requestEvidence(request),
      api_code: apiCode,
      environment,
      status: 'success',
      http_status: 200,
      provider_status: response.status,
      credits_deducted: cost,
      balance_after: remainingCredits,
      response_time_ms: responseTime,
      request_json: requestBody,
      response_json: outgoingResponse,
      metadata: { normalized_provider_payload: payload },
    });

    try {
      await archiveApiHubBureauPull({
        supabase,
        client,
        api,
        requestId,
        requestBody,
        normalizedPayload: payload,
        responseJson: response.data,
        creditsDeducted: cost,
      });
    } catch (archiveError) {
      console.warn('[api-hub:cibil] bureau pull archive skipped:', archiveError);
    }

    return NextResponse.json(outgoingResponse);
  } catch (error) {
    console.error('[api-hub:cibil] unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unexpected API Hub error';
    return jsonError(message, 500, requestId);
  }
}
