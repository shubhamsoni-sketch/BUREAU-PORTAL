'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  EyeOff,
  Globe2,
  KeyRound,
  LifeBuoy,
  LockKeyhole,
  Plus,
  ShieldCheck,
  WalletCards,
  X,
} from 'lucide-react';

type NavItem = 'Overview' | 'Onboarding' | 'Clients' | 'Environments' | 'API Keys' | 'IP Whitelist' | 'Credits' | 'Support' | 'Docs';
type Environment = 'UAT' | 'Production';
type ClientStatus = 'Production' | 'UAT' | 'Review' | 'Suspended';
type ApiProduct = 'Bureau Standard' | 'Bureau Advanced' | 'Mobile Prefill';
type ResponseMode = 'Full JSON' | 'CreditTrust Standard' | 'Custom';
type GateStatus = 'pending' | 'in_progress' | 'done' | 'blocked';
type OnboardingStage = 'CSR' | 'SSL' | 'UAT' | 'Sign-Off' | 'Production';

type ClientOnboarding = {
  stage: OnboardingStage;
  techSpoc: string;
  legalEntity: string;
  uatStaticIps: string[];
  productionStaticIps: string[];
  csrStatus: GateStatus;
  sslStatus: GateStatus;
  uatIpStatus: GateStatus;
  productionIpStatus: GateStatus;
  uatCredentialsStatus: GateStatus;
  payloadValidationStatus: GateStatus;
  uatSignoffStatus: GateStatus;
  productionCredentialsStatus: GateStatus;
  goLiveStatus: GateStatus;
  sslCommonName: string;
  csrReference: string;
  certificateExpiry: string;
  uatSignoffBy: string;
  uatSignoffAt: string;
};

type Client = {
  id: string;
  name: string;
  country: string;
  status: ClientStatus;
  contactEmail: string;
  uatCredits: number;
  liveCredits: number;
  ipWhitelistingRequired: boolean;
  ips: string[];
  onboarding: ClientOnboarding;
  apis: ApiProduct[];
  responseMode: ResponseMode;
  responseFields: string[];
  successRate: string;
};

type ApiKeyRecord = {
  id: string;
  clientId: string;
  environment: Environment;
  api: ApiProduct;
  label: string;
  prefix: string;
  secret?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
};

type UsageLog = {
  id: string;
  clientId: string;
  environment: Environment;
  api: ApiProduct;
  status: 'Success' | 'Failed';
  latency: string;
  charge: string;
  ip: string;
};

type HubApiConfig = {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'inactive';
};

type HubClient = {
  id: string;
  name: string;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  mobile: string | null;
  allowed_ips?: string[];
  metadata?: Record<string, unknown>;
  credits: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
};

type HubKey = {
  id: string;
  client_id: string;
  api_id: string;
  label: string;
  environment?: 'uat' | 'production';
  key_prefix: string;
  status: 'active' | 'inactive' | 'revoked';
  last_used_at: string | null;
  created_at: string;
};

type HubData = {
  apis: HubApiConfig[];
  clients: HubClient[];
  keys: HubKey[];
  tickets: SupportTicket[];
};

type SupportTicket = {
  id: string;
  ticket_number: string;
  client_id: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  subject: string;
  message: string;
  request_id?: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  client_email?: string | null;
  client_name?: string | null;
  internal_note?: string | null;
  last_response?: string | null;
  thread?: Array<{
    id: string;
    author: 'client' | 'operator' | 'system';
    message: string;
    created_at: string;
  }>;
  created_at: string;
  updated_at: string;
};

const navItems: NavItem[] = ['Overview', 'Onboarding', 'Clients', 'Environments', 'API Keys', 'IP Whitelist', 'Credits', 'Support', 'Docs'];
const apiProducts: ApiProduct[] = ['Bureau Standard', 'Bureau Advanced', 'Mobile Prefill'];
const environments: Environment[] = ['UAT', 'Production'];
const standardResponseFields = ['success', 'request_id', 'score', 'status', 'report_id', 'customer_name', 'bureau_summary'];
const responseFieldOptions = [
  ['success', 'Request success'],
  ['request_id', 'CreditTrust request id'],
  ['score', 'Bureau score'],
  ['status', 'Hit/no-hit status'],
  ['report_id', 'Report id'],
  ['customer_name', 'Customer name'],
  ['pan_masked', 'Masked PAN'],
  ['mobile_masked', 'Masked mobile'],
  ['bureau_summary', 'Bureau summary'],
  ['accounts_summary', 'Accounts summary'],
  ['enquiries_summary', 'Enquiries summary'],
  ['risk_band', 'Risk band'],
  ['raw_report', 'Raw provider report'],
] as const;

const sampleFieldValues: Record<string, unknown> = {
  success: true,
  request_id: 'ct_req_20260706_1021',
  score: 742,
  status: 'hit',
  report_id: 'ct_rpt_81f4',
  customer_name: 'CUSTOMER NAME',
  pan_masked: 'ABCDE****F',
  mobile_masked: '98******10',
  bureau_summary: { active_accounts: 4, overdue_amount: 0 },
  accounts_summary: { total_accounts: 12, live_accounts: 4 },
  enquiries_summary: { last_30_days: 2, last_90_days: 5 },
  risk_band: 'low',
  raw_report: { provider: 'cibil', response: 'full provider json' },
};

const onboardingSteps: Array<{ key: keyof ClientOnboarding; label: string; stage: OnboardingStage; description: string }> = [
  { key: 'csrStatus', label: 'CSR received', stage: 'CSR', description: 'Client CSR or hosted certificate plan captured' },
  { key: 'sslStatus', label: 'SSL/TLS issued', stage: 'SSL', description: 'Certificate provisioned and HTTPS path validated' },
  { key: 'uatIpStatus', label: 'UAT IP whitelisted', stage: 'UAT', description: 'Reserved UAT static IPs approved' },
  { key: 'uatCredentialsStatus', label: 'UAT credentials issued', stage: 'UAT', description: 'UAT API key and docs released' },
  { key: 'payloadValidationStatus', label: 'Payload validation passed', stage: 'UAT', description: 'Mandatory fields, consent and schema verified' },
  { key: 'uatSignoffStatus', label: 'UAT sign-off', stage: 'Sign-Off', description: 'Client confirms UAT request-response round trips' },
  { key: 'productionIpStatus', label: 'Production IP whitelisted', stage: 'Production', description: 'Production static IPs approved' },
  { key: 'productionCredentialsStatus', label: 'Production credentials issued', stage: 'Production', description: 'Live key released after UAT sign-off' },
  { key: 'goLiveStatus', label: 'Go-live approved', stage: 'Production', description: 'Production traffic allowed and monitored' },
];

function defaultOnboarding(overrides: Partial<ClientOnboarding> = {}): ClientOnboarding {
  return {
    stage: 'CSR',
    techSpoc: '',
    legalEntity: '',
    uatStaticIps: [],
    productionStaticIps: [],
    csrStatus: 'pending',
    sslStatus: 'pending',
    uatIpStatus: 'pending',
    productionIpStatus: 'pending',
    uatCredentialsStatus: 'pending',
    payloadValidationStatus: 'pending',
    uatSignoffStatus: 'pending',
    productionCredentialsStatus: 'pending',
    goLiveStatus: 'pending',
    sslCommonName: 'api.credittrust.in',
    csrReference: '',
    certificateExpiry: '',
    uatSignoffBy: '',
    uatSignoffAt: '',
    ...overrides,
  };
}

function gateTone(status: GateStatus): 'blue' | 'green' | 'amber' | 'red' | 'slate' {
  if (status === 'done') return 'green';
  if (status === 'blocked') return 'red';
  if (status === 'in_progress') return 'blue';
  return 'amber';
}

function gateLabel(status: GateStatus) {
  return status.replace(/_/g, ' ');
}

function onboardingProgress(client: Client) {
  const done = onboardingSteps.filter((step) => client.onboarding[step.key] === 'done').length;
  return Math.round((done / onboardingSteps.length) * 100);
}

function productionReady(client: Client) {
  return [
    'csrStatus',
    'sslStatus',
    'uatIpStatus',
    'uatCredentialsStatus',
    'payloadValidationStatus',
    'uatSignoffStatus',
    'productionIpStatus',
    'productionCredentialsStatus',
  ].every((key) => client.onboarding[key as keyof ClientOnboarding] === 'done');
}

function productionCredentialReady(client: Client) {
  return [
    'csrStatus',
    'sslStatus',
    'uatIpStatus',
    'uatCredentialsStatus',
    'payloadValidationStatus',
    'uatSignoffStatus',
    'productionIpStatus',
  ].every((key) => client.onboarding[key as keyof ClientOnboarding] === 'done');
}

const initialClients: Client[] = [];

const initialKeys: ApiKeyRecord[] = [];

const initialLogs: UsageLog[] = [];

const apiProductMap: Record<ApiProduct, string> = {
  'Bureau Standard': 'bureau-api',
  'Bureau Advanced': 'bureau-advanced',
  'Mobile Prefill': 'mobile-prefill',
};

function apiProductFromId(apiId: string, apis: HubApiConfig[] = []): ApiProduct {
  const api = apis.find((item) => item.id === apiId || item.code === apiId);
  const code = api?.code || api?.id || apiId;
  if (code === 'mobile-prefill') return 'Mobile Prefill';
  if (code === 'bureau-advanced') return 'Bureau Advanced';
  return 'Bureau Standard';
}

function apiIdForProduct(product: ApiProduct, apis: HubApiConfig[] = []) {
  const target = apiProductMap[product];
  return apis.find((api) => api.id === target || api.code === target)?.id || target;
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
}

function metadataObject(client: HubClient | Client) {
  const metadata = 'metadata' in client ? client.metadata : undefined;
  return metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? metadata as Record<string, unknown>
    : {};
}

function nestedRecord(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function mapHubClient(client: HubClient, keys: HubKey[], apis: HubApiConfig[]): Client {
  const metadata = metadataObject(client);
  const onboarding = nestedRecord(metadata, 'onboarding');
  const legal = nestedRecord(metadata, 'legal');
  const spoc = nestedRecord(metadata, 'spoc');
  const security = nestedRecord(metadata, 'security');
  const response = nestedRecord(metadata, 'response');
  const enabledApiIds = new Set(keys.filter((key) => key.client_id === client.id && key.status === 'active').map((key) => key.api_id));
  const products = Array.from(new Set(
    (enabledApiIds.size ? Array.from(enabledApiIds) : ['bureau-api'])
      .map((apiId) => apiProductFromId(apiId, apis)),
  ));
  const allowedIps = client.allowed_ips || [];
  const uatIps = asStringArray(onboarding.uatStaticIps).length
    ? asStringArray(onboarding.uatStaticIps)
    : asStringArray(security.uat_static_ips).length
      ? asStringArray(security.uat_static_ips)
      : allowedIps;
  const productionIps = asStringArray(onboarding.productionStaticIps).length
    ? asStringArray(onboarding.productionStaticIps)
    : asStringArray(security.production_static_ips);
  const uatSignoffAt = String(onboarding.uatSignoffAt || '');

  return {
    id: client.id,
    name: client.name,
    country: String(legal.country_of_operation || metadata.country || '-'),
    status: client.status === 'inactive' ? 'Suspended' : uatSignoffAt || onboarding.stage === 'Production' ? 'Production' : 'UAT',
    contactEmail: client.email || String(spoc.technical_email || spoc.business_email || ''),
    uatCredits: Number(client.credits || 0),
    liveCredits: Number(metadata.live_credits || 0),
    ipWhitelistingRequired: Boolean(security.static_ip_required ?? true),
    ips: allowedIps,
    onboarding: defaultOnboarding({
      stage: (onboarding.stage as OnboardingStage) || 'UAT',
      techSpoc: String(onboarding.techSpoc || spoc.technical_email || client.contact_name || client.email || ''),
      legalEntity: String(onboarding.legalEntity || legal.legal_entity_name || client.company_name || client.name),
      uatStaticIps: uatIps,
      productionStaticIps: productionIps,
      csrStatus: (onboarding.csrStatus as GateStatus) || (security.binta_client_csr ? 'done' : 'pending'),
      sslStatus: (onboarding.sslStatus as GateStatus) || (security.certificate_status === 'active' ? 'done' : 'in_progress'),
      uatIpStatus: (onboarding.uatIpStatus as GateStatus) || (uatIps.length ? 'done' : 'pending'),
      productionIpStatus: (onboarding.productionIpStatus as GateStatus) || (productionIps.length ? 'done' : 'pending'),
      uatCredentialsStatus: (onboarding.uatCredentialsStatus as GateStatus) || (keys.some((key) => key.client_id === client.id && key.environment !== 'production' && key.status === 'active') ? 'done' : 'pending'),
      payloadValidationStatus: (onboarding.payloadValidationStatus as GateStatus) || 'pending',
      uatSignoffStatus: (onboarding.uatSignoffStatus as GateStatus) || 'pending',
      productionCredentialsStatus: (onboarding.productionCredentialsStatus as GateStatus) || (keys.some((key) => key.client_id === client.id && key.environment === 'production' && key.status === 'active') ? 'done' : 'pending'),
      goLiveStatus: (onboarding.goLiveStatus as GateStatus) || 'pending',
      sslCommonName: String(onboarding.sslCommonName || security.csr_common_name || nestedRecord(security, 'binta_client_csr').common_name || 'api.credittrust.in'),
      csrReference: String(onboarding.csrReference || security.certificate_status || ''),
      certificateExpiry: String(onboarding.certificateExpiry || security.certificate_expiry || ''),
      uatSignoffBy: String(onboarding.uatSignoffBy || ''),
      uatSignoffAt,
    }),
    apis: products.length ? products : ['Bureau Standard'],
    responseMode: String(response.mode || metadata.response_mode || 'credittrust_standard') === 'custom'
      ? 'Custom'
      : String(response.mode || metadata.response_mode || '') === 'full_json'
        ? 'Full JSON'
        : 'CreditTrust Standard',
    responseFields: asStringArray(response.fields).length ? asStringArray(response.fields) : standardResponseFields,
    successRate: '-',
  };
}

function mapHubKey(key: HubKey, apis: HubApiConfig[]): ApiKeyRecord {
  return {
    id: key.id,
    clientId: key.client_id,
    environment: key.environment === 'production' ? 'Production' : 'UAT',
    api: apiProductFromId(key.api_id, apis),
    label: key.label,
    prefix: key.key_prefix,
    status: key.status === 'active' ? 'Active' : 'Inactive',
    createdAt: new Date(key.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
  };
}

function isBridgeConsoleClient(client: HubClient) {
  const metadata = metadataObject(client);
  const legal = nestedRecord(metadata, 'legal');
  const scope = String(metadata.bridge_console_scope || metadata.console_scope || '').toLowerCase();
  const name = `${client.name} ${client.company_name || ''} ${legal.legal_entity_name || ''}`.toLowerCase();

  return scope === 'binta_bridge' || name.includes('binta financial');
}

function clientToHubPayload(client: Client) {
  return {
    action: 'update_client',
    client_id: client.id,
    name: client.name,
    company_name: client.onboarding.legalEntity || client.name,
    contact_name: client.onboarding.techSpoc || client.contactEmail,
    email: client.contactEmail,
    allowed_ips: client.ips.join(','),
    credits: client.uatCredits,
    status: client.status === 'Suspended' ? 'inactive' : 'active',
    metadata: {
      bridge_console_scope: 'binta_bridge',
      country: client.country,
      live_credits: client.liveCredits,
      onboarding: client.onboarding,
      response: {
        mode: client.responseMode === 'Full JSON' ? 'full_json' : client.responseMode === 'Custom' ? 'custom' : 'credittrust_standard',
        fields: client.responseFields,
      },
      security: {
        static_ip_required: client.ipWhitelistingRequired,
        uat_static_ips: client.onboarding.uatStaticIps,
        production_static_ips: client.onboarding.productionStaticIps,
        csr_common_name: client.onboarding.sslCommonName,
        certificate_status: client.onboarding.csrReference,
      },
      legal: {
        legal_entity_name: client.onboarding.legalEntity || client.name,
        country_of_operation: client.country,
      },
      spoc: {
        technical_email: client.onboarding.techSpoc || client.contactEmail,
      },
    },
  };
}

const normalizedResponse = `{
  "success": true,
  "request_id": "ct_req_20260704_9121",
  "data": {
    "score": 742,
    "status": "hit",
    "bureau": {
      "provider": "CIBIL",
      "report_id": "ct_rpt_81f4"
    }
  }
}`;

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function randomId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function keyPrefix(environment: Environment) {
  const random = Math.random().toString(16).slice(2, 10);
  return environment === 'Production' ? `ctlive_${random}` : `ctuat_${random}`;
}

function todayLabel() {
  return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function keyValue(key: ApiKeyRecord) {
  return key.secret || `${key.prefix}...`;
}

function maskedKeyValue(key: ApiKeyRecord) {
  const prefix = key.prefix || 'ct_key';
  return `${prefix}${'*'.repeat(18)}`;
}

function endpointFor(api: ApiProduct, environment: Environment) {
  const envQuery = environment === 'UAT' ? '?env=uat' : '';
  if (api === 'Bureau Standard') return `POST https://api.credittrust.in/api/v1/bureau${envQuery}`;
  if (api === 'Bureau Advanced') return `POST https://api.credittrust.in/api/v1/bureau-advanced${envQuery}`;
  return `POST https://api.credittrust.in/api/v1/mobile-prefill${envQuery}`;
}

function payloadFor(api: ApiProduct) {
  if (api === 'Bureau Standard') {
    return `{
  "firstName": "",
  "lastName": "",
  "dob": "YYYY-MM-DD",
  "gender": "male",
  "pan": "",
  "mobile": "",
  "address": "",
  "state": "MADHYA PRADESH",
  "pincode": "",
  "consent": true
}`;
  }
  if (api === 'Bureau Advanced') {
    return `{
  "mobile": "",
  "consent": true
}`;
  }
  return `{
  "mobile_number": ""
  }`;
}

function fieldsForMode(mode: ResponseMode, fields: string[]) {
  if (mode === 'Full JSON') return ['raw_report'];
  if (mode === 'CreditTrust Standard') return standardResponseFields;
  return fields.length ? fields : ['success', 'request_id', 'status'];
}

function responsePreview(mode: ResponseMode, fields: string[]) {
  const selectedFields = fieldsForMode(mode, fields);
  return selectedFields.reduce<Record<string, unknown>>((preview, field) => {
    preview[field] = sampleFieldValues[field] ?? 'value';
    return preview;
  }, {});
}

function buildApiDoc(client: Client, key: ApiKeyRecord) {
  const responseFields = fieldsForMode(client.responseMode, client.responseFields);
  return `CreditTrust API Documentation

Client: ${client.name}
Environment: ${key.environment}
API: ${key.api}
Response: ${client.responseMode}
Fields: ${responseFields.join(', ')}
Endpoint: ${endpointFor(key.api, key.environment)}

Headers:
content-type: application/json
accept: application/json
x-api-key: ${keyValue(key)}

Payload:
${payloadFor(key.api)}
`;
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function MetricCard({ label, value, helper, icon: Icon, tone }: { label: string; value: string; helper: string; icon: React.ElementType; tone: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-800 uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-900 tracking-normal text-foreground">{value}</p>
          <p className="mt-1 text-xs font-600 text-muted-foreground">{helper}</p>
        </div>
        <span className={classNames('flex h-10 w-10 items-center justify-center rounded-lg', tone)}>
          <Icon size={18} />
        </span>
      </div>
    </div>
  );
}

function StatusPill({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'blue' | 'green' | 'amber' | 'red' | 'slate' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  return (
    <span className={classNames('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-800', tones[tone])}>
      {children}
    </span>
  );
}

function SecurityGateCard({ client }: { client: Client }) {
  const progress = onboardingProgress(client);
  const blocked = onboardingSteps.filter((step) => client.onboarding[step.key] === 'blocked').length;
  const nextStep = onboardingSteps.find((step) => client.onboarding[step.key] !== 'done');
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-900 text-foreground">{client.name}</p>
          <p className="mt-1 text-xs font-700 text-muted-foreground">{client.onboarding.stage} - {client.onboarding.techSpoc || client.contactEmail}</p>
        </div>
        <StatusPill tone={productionReady(client) ? 'green' : blocked ? 'red' : 'blue'}>{progress}% ready</StatusPill>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={classNames('h-full rounded-full', productionReady(client) ? 'bg-emerald-500' : 'bg-blue-600')} style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="font-900 uppercase tracking-wide text-muted-foreground">UAT IPs</p>
          <p className="mt-1 font-900 text-foreground">{client.onboarding.uatStaticIps.length || client.ips.length}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="font-900 uppercase tracking-wide text-muted-foreground">Prod IPs</p>
          <p className="mt-1 font-900 text-foreground">{client.onboarding.productionStaticIps.length}</p>
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3">
        <p className="text-[10px] font-900 uppercase tracking-wide text-muted-foreground">Next gate</p>
        <p className="mt-1 text-sm font-900 text-foreground">{nextStep?.label || 'Production live'}</p>
        <p className="mt-1 text-xs font-700 text-muted-foreground">{nextStep?.description || 'All security gates completed'}</p>
      </div>
    </div>
  );
}

function OnboardingChecklist({ client, onUpdate }: { client: Client; onUpdate?: (client: Client) => void }) {
  const updateGate = (key: keyof ClientOnboarding, status: GateStatus) => {
    if (!onUpdate) return;
    onUpdate({ ...client, onboarding: { ...client.onboarding, [key]: status } });
  };

  return (
    <div className="rounded-lg border border-border bg-white">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-sm font-900 text-foreground">Secure onboarding gates</p>
          <p className="text-xs font-700 text-muted-foreground">CSR to UAT sign-off to production go-live</p>
        </div>
        <StatusPill tone={productionReady(client) ? 'green' : 'blue'}>{onboardingProgress(client)}%</StatusPill>
      </div>
      <div className="divide-y divide-border">
        {onboardingSteps.map((step) => {
          const value = client.onboarding[step.key] as GateStatus;
          return (
            <div key={step.key} className="grid grid-cols-1 gap-3 px-4 py-3 lg:grid-cols-[0.9fr_1.2fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-900 text-foreground">{step.label}</p>
                <p className="text-[11px] font-800 uppercase tracking-wide text-muted-foreground">{step.stage}</p>
              </div>
              <p className="text-xs font-700 text-muted-foreground">{step.description}</p>
              {onUpdate ? (
                <select
                  value={value}
                  onChange={(event) => updateGate(step.key, event.target.value as GateStatus)}
                  className="h-9 rounded-lg border border-border bg-white px-3 text-xs font-900 text-foreground"
                >
                  <option value="pending">pending</option>
                  <option value="in_progress">in progress</option>
                  <option value="done">done</option>
                  <option value="blocked">blocked</option>
                </select>
              ) : (
                <StatusPill tone={gateTone(value)}>{gateLabel(value)}</StatusPill>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OnboardingBoard({ clients, onManage }: { clients: Client[]; onManage: (clientId: string) => void }) {
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.25fr]">
      <Panel title="Client Onboarding Command" subtitle="Track each client from CSR collection to production activation">
        <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
          {clients.map((client) => (
            <button key={client.id} onClick={() => onManage(client.id)} className="text-left">
              <SecurityGateCard client={client} />
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Security Protocol" subtitle="What must be completed before production traffic is allowed">
        <div className="grid grid-cols-1 gap-3 p-4">
          {[
            ['1', 'CSR / TLS validation', 'Capture CSR reference or managed TLS decision. No plain HTTP path is allowed.'],
            ['2', 'Static IP reservation', 'UAT and production source IPs must be fixed, owned and documented.'],
            ['3', 'UAT credentials', 'Issue UAT-only API key with UAT credits and schema validation scope.'],
            ['4', 'Payload and consent validation', 'Mandatory fields and consent metadata must pass before sign-off.'],
            ['5', 'Production promotion', 'Production key, production IP allowlist and go-live approval are separate gates.'],
          ].map(([step, title, text]) => (
            <div key={step} className="flex gap-3 rounded-lg border border-border bg-slate-50 p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-xs font-900 text-white">{step}</span>
              <div>
                <p className="text-sm font-900 text-foreground">{title}</p>
                <p className="mt-1 text-xs font-700 text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Panel({ title, subtitle, children, action }: { title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-900 text-foreground">{title}</h3>
          {subtitle ? <p className="text-xs font-600 text-muted-foreground">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-900 uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-5 py-4">
          <h2 className="text-lg font-900 text-foreground">{title}</h2>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-slate-600">
            <X size={17} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ClientsTable({
  clients,
  selectedClientId,
  onSelect,
  onManage,
  onCreateKey,
}: {
  clients: Client[];
  selectedClientId?: string;
  onSelect?: (clientId: string) => void;
  onManage: (clientId: string) => void;
  onCreateKey: (clientId: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px]">
        <thead className="bg-slate-50">
          <tr>
            {['Client', 'Status', 'Onboarding', 'APIs', 'Response', 'Credits', 'IP Policy', 'Whitelisted IPs', 'Action'].map((head) => (
              <th key={head} className="px-4 py-3 text-left text-[11px] font-900 uppercase tracking-wide text-slate-500">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {clients.map((client) => (
            <tr
              key={client.id}
              onClick={() => onSelect?.(client.id)}
              className={classNames('cursor-pointer bg-white transition hover:bg-slate-50', selectedClientId === client.id && 'bg-blue-50/60')}
            >
              <td className="px-4 py-4">
                <p className="text-sm font-900 text-foreground">{client.name}</p>
                <p className="text-xs font-600 text-muted-foreground">{client.country} - {client.contactEmail}</p>
              </td>
              <td className="px-4 py-4">
                <StatusPill tone={client.status === 'Production' ? 'green' : client.status === 'UAT' ? 'blue' : client.status === 'Suspended' ? 'red' : 'amber'}>
                  {client.status}
                </StatusPill>
              </td>
              <td className="px-4 py-4">
                <div className="min-w-36">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs font-900 text-foreground">{client.onboarding.stage}</span>
                    <span className="text-[11px] font-900 text-muted-foreground">{onboardingProgress(client)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={classNames('h-full rounded-full', productionReady(client) ? 'bg-emerald-500' : 'bg-blue-600')} style={{ width: `${onboardingProgress(client)}%` }} />
                  </div>
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-1.5">
                  {client.apis.map((api) => <StatusPill key={api} tone="slate">{api}</StatusPill>)}
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="flex flex-col gap-1">
                  <StatusPill tone={client.responseMode === 'Full JSON' ? 'amber' : client.responseMode === 'Custom' ? 'blue' : 'green'}>{client.responseMode}</StatusPill>
                  <span className="text-xs font-700 text-muted-foreground">{fieldsForMode(client.responseMode, client.responseFields).length} fields</span>
                </div>
              </td>
              <td className="px-4 py-4 text-sm font-900 text-foreground">
                <span className="block">UAT {client.uatCredits}</span>
                <span className="block text-xs text-muted-foreground">Live {client.liveCredits}</span>
              </td>
              <td className="px-4 py-4">
                <StatusPill tone={client.ipWhitelistingRequired ? 'green' : 'amber'}>
                  {client.ipWhitelistingRequired ? 'Required' : 'Optional'}
                </StatusPill>
              </td>
              <td className="px-4 py-4 text-xs font-700 text-muted-foreground">
                {client.ips.length ? client.ips.join(', ') : 'No IPs added'}
              </td>
              <td className="px-4 py-4">
                <div className="flex gap-2">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onManage(client.id);
                    }}
                    className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-900 text-foreground"
                  >
                    Manage
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onCreateKey(client.id);
                    }}
                    aria-label={`Generate key for ${client.name}`}
                    className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-900 text-white"
                  >
                    Key
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LogsTable({ logs, clients }: { logs: UsageLog[]; clients: Client[] }) {
  const clientById = new Map(clients.map((client) => [client.id, client.name]));
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px]">
        <thead className="bg-slate-50">
          <tr>
            {['Request ID', 'Client', 'Env', 'API', 'Source IP', 'Status', 'Latency', 'Charge'].map((head) => (
              <th key={head} className="px-4 py-3 text-left text-[11px] font-900 uppercase tracking-wide text-slate-500">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="px-4 py-3 text-sm font-800 text-foreground">{log.id}</td>
              <td className="px-4 py-3 text-sm font-700 text-foreground">{clientById.get(log.clientId) || 'Unknown'}</td>
              <td className="px-4 py-3 text-sm font-700 text-foreground">{log.environment}</td>
              <td className="px-4 py-3 text-sm font-700 text-foreground">{log.api}</td>
              <td className="px-4 py-3 text-sm font-700 text-muted-foreground">{log.ip}</td>
              <td className="px-4 py-3"><StatusPill tone={log.status === 'Success' ? 'green' : 'red'}>{log.status}</StatusPill></td>
              <td className="px-4 py-3 text-sm font-700 text-foreground">{log.latency}</td>
              <td className="px-4 py-3 text-sm font-700 text-foreground">{log.charge}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ClientKeyDirectory({
  keys,
  clients,
  onCreateKey,
  onDeleteKey,
  onDeleteUatKeys,
  onToggleKeyStatus,
  revealedSecrets,
}: {
  keys: ApiKeyRecord[];
  clients: Client[];
  onCreateKey: (clientId?: string) => void;
  onDeleteKey: (keyId: string) => void;
  onDeleteUatKeys: (clientId: string) => void;
  onToggleKeyStatus: (key: ApiKeyRecord) => void;
  revealedSecrets: Record<string, string>;
}) {
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  const copyKey = (key: ApiKeyRecord) => {
    const value = revealedSecrets[key.id] || key.secret;
    if (value) navigator.clipboard?.writeText(value);
  };

  return (
    <Panel
      title="Client API Keys"
      action={<button onClick={() => onCreateKey()} className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-900 text-white"><KeyRound size={15} />Generate Key</button>}
    >
      <div className="divide-y divide-border">
        {clients.map((client) => {
          const clientKeys = keys.filter((key) => key.clientId === client.id);
          const uatKeys = clientKeys.filter((key) => key.environment === 'UAT');
          const productionKeys = clientKeys.filter((key) => key.environment === 'Production');
          return (
            <div key={client.id} className="p-4">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-lg font-900 text-foreground">{client.name}</p>
                  <p className="text-xs font-700 text-muted-foreground">{client.country} - {client.contactEmail}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill tone={client.status === 'Production' ? 'green' : client.status === 'UAT' ? 'blue' : client.status === 'Suspended' ? 'red' : 'amber'}>{client.status}</StatusPill>
                  <StatusPill tone={client.responseMode === 'Full JSON' ? 'amber' : client.responseMode === 'Custom' ? 'blue' : 'green'}>{client.responseMode}</StatusPill>
                  <button onClick={() => onDeleteUatKeys(client.id)} className="h-9 rounded-lg border border-red-100 bg-red-50 px-3 text-xs font-900 text-red-700">Clear UAT Keys</button>
                  <button onClick={() => onCreateKey(client.id)} className="h-9 rounded-lg border border-border bg-white px-3 text-xs font-900 text-foreground">Generate Key</button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {([
                  ['UAT', uatKeys],
                  ['Production', productionKeys],
                ] as Array<[Environment, ApiKeyRecord[]]>).map(([environment, environmentKeys]) => (
                  <div key={environment} className="rounded-lg border border-border bg-slate-50">
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                      <p className="text-sm font-900 text-foreground">{environment}</p>
                      <StatusPill tone={environment === 'Production' ? 'green' : 'blue'}>{environmentKeys.length} Keys</StatusPill>
                    </div>
                    <div className="space-y-3 p-4">
                      {environmentKeys.length ? environmentKeys.map((key) => (
                        <div key={key.id} className="rounded-lg border border-border bg-white p-3">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <StatusPill tone="slate">{key.api}</StatusPill>
                            <StatusPill tone={key.status === 'Active' ? 'green' : 'red'}>{key.status}</StatusPill>
                            <span className="text-xs font-800 text-muted-foreground">{key.createdAt}</span>
                          </div>
                          <div className="flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-3 font-mono text-xs font-800 leading-5 text-white">
                            <span className="min-w-0 flex-1 break-all">
                              {visibleKeys[key.id] && (revealedSecrets[key.id] || key.secret)
                                ? (revealedSecrets[key.id] || key.secret)
                                : maskedKeyValue(key)}
                            </span>
                            <button
                              type="button"
                              onClick={() => setVisibleKeys((current) => ({ ...current, [key.id]: !current[key.id] }))}
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/10 text-white"
                              title={(revealedSecrets[key.id] || key.secret) ? 'Show or hide full key' : 'Full key is available only immediately after generation'}
                              aria-label={(visibleKeys[key.id] ? 'Hide' : 'Show') + ` API key for ${client.name}`}
                            >
                              {visibleKeys[key.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              onClick={() => copyKey(key)}
                              disabled={!(revealedSecrets[key.id] || key.secret)}
                              className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-white px-3 text-xs font-900 text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Copy size={13} />
                              Copy
                            </button>
                            <button
                              onClick={() => downloadTextFile(`${client.name.replace(/\s+/g, '-').toLowerCase()}-${key.environment.toLowerCase()}-${key.api.replace(/\s+/g, '-').toLowerCase()}-api-doc.txt`, buildApiDoc(client, key))}
                              className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-white px-3 text-xs font-900 text-foreground"
                            >
                              <Download size={13} />
                              Doc
                            </button>
                            <button
                              onClick={() => onDeleteKey(key.id)}
                              className="inline-flex h-8 items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 text-xs font-900 text-red-700"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => onToggleKeyStatus(key)}
                              className={classNames(
                                'inline-flex h-8 items-center gap-2 rounded-lg border px-3 text-xs font-900',
                                key.status === 'Active'
                                  ? 'border-amber-100 bg-amber-50 text-amber-700'
                                  : 'border-emerald-100 bg-emerald-50 text-emerald-700',
                              )}
                            >
                              {key.status === 'Active' ? 'Make Inactive' : 'Make Active'}
                            </button>
                          </div>
                          {!(revealedSecrets[key.id] || key.secret) ? (
                            <p className="mt-2 text-[11px] font-800 text-slate-500">Full key is not stored. Generate a new key to reveal/copy it once.</p>
                          ) : null}
                        </div>
                      )) : (
                        <div className="rounded-lg border border-dashed border-border bg-white px-4 py-6 text-sm font-800 text-muted-foreground">No {environment} key</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function ProductCatalog() {
  const products = [
    ['Bureau Standard', 'POST /api/v1/bureau', 'Live-ready'],
    ['Bureau Advanced', 'POST /api/v1/bureau-advanced', 'Priority'],
    ['Mobile Prefill', 'POST /api/v1/mobile-prefill', 'UAT'],
  ];
  return (
    <Panel title="API Products">
      <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-3">
        {products.map(([name, endpoint, status]) => (
          <div key={name} className="rounded-lg border border-border bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-900 text-foreground">{name}</p>
                <p className="mt-1 text-xs font-800 text-muted-foreground">{endpoint}</p>
              </div>
              <StatusPill tone={status === 'Priority' ? 'green' : status === 'UAT' ? 'blue' : 'slate'}>{status}</StatusPill>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ClientDetailPanel({
  client,
  keys,
  onManage,
  onCreateKey,
}: {
  client?: Client;
  keys: ApiKeyRecord[];
  onManage: (clientId: string) => void;
  onCreateKey: (clientId: string) => void;
}) {
  if (!client) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <Globe2 size={20} />
        </div>
        <p className="text-sm font-900 text-foreground">Select a client</p>
      </div>
    );
  }

  const clientKeys = keys.filter((key) => key.clientId === client.id);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-900 text-foreground">{client.name}</p>
            <p className="text-xs font-700 text-muted-foreground">{client.country} - {client.contactEmail}</p>
          </div>
          <StatusPill tone={client.status === 'Production' ? 'green' : client.status === 'UAT' ? 'blue' : client.status === 'Suspended' ? 'red' : 'amber'}>{client.status}</StatusPill>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-slate-50 p-3">
            <p className="text-[10px] font-900 uppercase tracking-wide text-muted-foreground">UAT Credits</p>
            <p className="mt-1 text-xl font-900 text-foreground">{client.uatCredits}</p>
          </div>
          <div className="rounded-lg border border-border bg-slate-50 p-3">
            <p className="text-[10px] font-900 uppercase tracking-wide text-muted-foreground">Live Credits</p>
            <p className="mt-1 text-xl font-900 text-foreground">{client.liveCredits}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {client.apis.map((api) => <StatusPill key={api} tone="slate">{api}</StatusPill>)}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={() => onManage(client.id)} className="h-9 rounded-lg border border-border bg-white text-xs font-900 text-foreground">Manage Setup</button>
          <button onClick={() => onCreateKey(client.id)} className="h-9 rounded-lg bg-blue-600 text-xs font-900 text-white">Generate Key</button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-900 text-foreground">Production readiness</h3>
            <p className="text-xs font-700 text-muted-foreground">{client.onboarding.stage} stage - {client.onboarding.legalEntity || client.name}</p>
          </div>
          <StatusPill tone={productionReady(client) ? 'green' : 'blue'}>{onboardingProgress(client)}%</StatusPill>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className={classNames('h-full rounded-full', productionReady(client) ? 'bg-emerald-500' : 'bg-blue-600')} style={{ width: `${onboardingProgress(client)}%` }} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[10px] font-900 uppercase tracking-wide text-muted-foreground">CSR/SSL</p>
            <p className="mt-1 text-sm font-900 text-foreground">{gateLabel(client.onboarding.sslStatus)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[10px] font-900 uppercase tracking-wide text-muted-foreground">UAT Sign-off</p>
            <p className="mt-1 text-sm font-900 text-foreground">{gateLabel(client.onboarding.uatSignoffStatus)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-900 text-foreground">Client Summary</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[10px] font-900 uppercase tracking-wide text-muted-foreground">IP Policy</p>
            <p className="mt-1 text-sm font-900 text-foreground">{client.ipWhitelistingRequired ? 'Required' : 'Optional'}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[10px] font-900 uppercase tracking-wide text-muted-foreground">IPs</p>
            <p className="mt-1 text-sm font-900 text-foreground">{client.ips.length}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[10px] font-900 uppercase tracking-wide text-muted-foreground">Keys</p>
            <p className="mt-1 text-sm font-900 text-foreground">{clientKeys.length}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[10px] font-900 uppercase tracking-wide text-muted-foreground">Response</p>
            <p className="mt-1 text-sm font-900 text-foreground">{client.responseMode}</p>
            <p className="mt-1 text-xs font-700 text-muted-foreground">{fieldsForMode(client.responseMode, client.responseFields).length} fields</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function NormalizedResponsePanel() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="text-emerald-700" size={18} />
        <h3 className="text-base font-900 text-foreground">Response Format</h3>
      </div>
      <pre className="max-h-[260px] overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-100 scrollbar-thin">
        {normalizedResponse}
      </pre>
    </div>
  );
}

function ClientForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (client: Client) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: '',
    country: '',
    contactEmail: '',
    legalEntity: '',
    techSpoc: '',
    status: 'UAT' as ClientStatus,
    uatCredits: '10',
    liveCredits: '0',
    ipWhitelistingRequired: true,
    ips: '',
    productionIps: '',
    csrReference: '',
    sslCommonName: 'api.credittrust.in',
    apis: ['Bureau Standard'] as ApiProduct[],
  });

  const toggleApi = (api: ApiProduct) => {
    setForm((prev) => ({
      ...prev,
      apis: prev.apis.includes(api) ? prev.apis.filter((item) => item !== api) : [...prev.apis, api],
    }));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name || !form.country.trim()) return;
    const uatIps = form.ips.split(',').map((ip) => ip.trim()).filter(Boolean);
    const productionIps = form.productionIps.split(',').map((ip) => ip.trim()).filter(Boolean);
    onSubmit({
      id: randomId('client'),
      name,
      country: form.country.trim(),
      contactEmail: form.contactEmail.trim() || 'tech@example.com',
      status: form.status,
      uatCredits: Math.max(0, Number(form.uatCredits || 0)),
      liveCredits: Math.max(0, Number(form.liveCredits || 0)),
      ipWhitelistingRequired: form.ipWhitelistingRequired,
      ips: [...uatIps, ...productionIps],
      onboarding: defaultOnboarding({
        stage: 'CSR',
        legalEntity: form.legalEntity.trim() || name,
        techSpoc: form.techSpoc.trim() || form.contactEmail.trim(),
        uatStaticIps: uatIps,
        productionStaticIps: productionIps,
        csrStatus: form.csrReference.trim() ? 'in_progress' : 'pending',
        uatIpStatus: uatIps.length ? 'in_progress' : 'pending',
        productionIpStatus: productionIps.length ? 'in_progress' : 'pending',
        csrReference: form.csrReference.trim(),
        sslCommonName: form.sslCommonName.trim() || 'api.credittrust.in',
      }),
      apis: form.apis.length ? form.apis : ['Bureau Standard'],
      responseMode: 'CreditTrust Standard',
      responseFields: ['score', 'status', 'report_id', 'customer_name', 'accounts_summary'],
      successRate: '-',
    });
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Client name">
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="input-base" placeholder="Binta Financial Inc." />
        </Field>
        <Field label="Country">
          <input value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} className="input-base" placeholder="Canada" />
        </Field>
        <Field label="Technical email">
          <input value={form.contactEmail} onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} className="input-base" placeholder="tech@client.com" />
        </Field>
        <Field label="Legal entity">
          <input value={form.legalEntity} onChange={(event) => setForm({ ...form, legalEntity: event.target.value })} className="input-base" placeholder="Binta Financial Inc." />
        </Field>
        <Field label="Technical SPOC">
          <input value={form.techSpoc} onChange={(event) => setForm({ ...form, techSpoc: event.target.value })} className="input-base" placeholder="Engineering / DevOps owner" />
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ClientStatus })} className="input-base">
            <option>UAT</option>
            <option>Production</option>
            <option>Review</option>
            <option>Suspended</option>
          </select>
        </Field>
        <Field label="UAT credits">
          <input value={form.uatCredits} onChange={(event) => setForm({ ...form, uatCredits: event.target.value })} className="input-base" type="number" min="0" />
        </Field>
        <Field label="Production credits">
          <input value={form.liveCredits} onChange={(event) => setForm({ ...form, liveCredits: event.target.value })} className="input-base" type="number" min="0" />
        </Field>
      </div>

      <div className="rounded-lg border border-border bg-slate-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-900 text-foreground">IP whitelisting required</p>
          </div>
          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, ipWhitelistingRequired: !prev.ipWhitelistingRequired }))}
            className={classNames('h-9 rounded-lg px-4 text-xs font-900 text-white', form.ipWhitelistingRequired ? 'bg-emerald-600' : 'bg-amber-500')}
          >
            {form.ipWhitelistingRequired ? 'Required' : 'Optional'}
          </button>
        </div>
        <div className="mt-4">
          <Field label="Allowed IPs">
            <input value={form.ips} onChange={(event) => setForm({ ...form, ips: event.target.value })} className="input-base" placeholder="3.109.33.183" />
          </Field>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Production static IPs">
            <input value={form.productionIps} onChange={(event) => setForm({ ...form, productionIps: event.target.value })} className="input-base" placeholder="Production IPs after UAT sign-off" />
          </Field>
          <Field label="SSL common name">
            <input value={form.sslCommonName} onChange={(event) => setForm({ ...form, sslCommonName: event.target.value })} className="input-base" placeholder="api.credittrust.in" />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="CSR reference / certificate note">
            <input value={form.csrReference} onChange={(event) => setForm({ ...form, csrReference: event.target.value })} className="input-base" placeholder="CSR pending / managed TLS / client CSR ticket" />
          </Field>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-900 uppercase tracking-wide text-slate-500">API access</p>
        <div className="flex flex-wrap gap-2">
          {apiProducts.map((api) => (
            <button
              key={api}
              type="button"
              onClick={() => toggleApi(api)}
              className={classNames('rounded-lg border px-3 py-2 text-xs font-900', form.apis.includes(api) ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-border bg-white text-slate-600')}
            >
              {api}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button type="button" onClick={onCancel} className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-900 text-foreground">Cancel</button>
        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-900 text-white">Create Client</button>
      </div>
    </form>
  );
}

function KeyForm({
  clients,
  initialClientId,
  onSubmit,
  onCancel,
}: {
  clients: Client[];
  initialClientId?: string;
  onSubmit: (key: ApiKeyRecord) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    clientId: initialClientId || clients[0]?.id || '',
    environment: 'UAT' as Environment,
    api: 'Bureau Standard' as ApiProduct,
    label: '',
  });
  const selectedClient = clients.find((client) => client.id === form.clientId);
  const productionBlocked = form.environment === 'Production' && selectedClient ? !productionCredentialReady(selectedClient) : false;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.clientId) return;
    if (productionBlocked) return;
    onSubmit({
      id: randomId('key'),
      clientId: form.clientId,
      environment: form.environment,
      api: form.api,
      label: form.label.trim() || `${selectedClient?.name || 'Client'} ${form.environment} ${form.api}`,
      prefix: keyPrefix(form.environment),
      status: 'Active',
      createdAt: todayLabel(),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Client">
          <select value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })} className="input-base">
            {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
        </Field>
        <Field label="Environment">
          <select value={form.environment} onChange={(event) => setForm({ ...form, environment: event.target.value as Environment })} className="input-base">
            {environments.map((env) => <option key={env}>{env}</option>)}
          </select>
        </Field>
        <Field label="API">
          <select value={form.api} onChange={(event) => setForm({ ...form, api: event.target.value as ApiProduct })} className="input-base">
            {apiProducts.map((api) => <option key={api}>{api}</option>)}
          </select>
        </Field>
        <Field label="Label">
          <input value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} className="input-base" placeholder="Production bureau key" />
        </Field>
      </div>
      {selectedClient ? (
        <div className="rounded-lg border border-border bg-slate-50 p-4">
          <p className="text-sm font-900 text-foreground">{selectedClient.name}</p>
          <p className="text-xs font-700 text-muted-foreground">
            IP policy: {selectedClient.ipWhitelistingRequired ? 'Required' : 'Optional'} - APIs: {selectedClient.apis.join(', ')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusPill tone={productionCredentialReady(selectedClient) ? 'green' : 'blue'}>{onboardingProgress(selectedClient)}% onboarded</StatusPill>
            <StatusPill tone={selectedClient.onboarding.uatSignoffStatus === 'done' ? 'green' : 'amber'}>UAT sign-off {gateLabel(selectedClient.onboarding.uatSignoffStatus)}</StatusPill>
          </div>
          {productionBlocked ? (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-800 text-amber-800">
              Production credentials are locked until CSR, SSL, UAT IP, UAT credentials, payload validation, UAT sign-off and production IP gates are complete.
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button type="button" onClick={onCancel} className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-900 text-foreground">Cancel</button>
        <button type="submit" disabled={productionBlocked} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-900 text-white disabled:cursor-not-allowed disabled:opacity-50">Generate Key</button>
      </div>
    </form>
  );
}

function ManageClientModal({
  client,
  onClose,
  onUpdate,
  onAddIp,
  onRemoveIp,
  onAddCredits,
  onCreateKey,
}: {
  client: Client;
  onClose: () => void;
  onUpdate: (client: Client) => void;
  onAddIp: (clientId: string, ip: string) => void;
  onRemoveIp: (clientId: string, ip: string) => void;
  onAddCredits: (clientId: string, environment: Environment, credits: number) => void;
  onCreateKey: (clientId: string) => void;
}) {
  const [ip, setIp] = useState('');
  const [prodIp, setProdIp] = useState('');
  const [credits, setCredits] = useState('10');
  const [creditEnv, setCreditEnv] = useState<Environment>('UAT');
  const effectiveFields = fieldsForMode(client.responseMode, client.responseFields);
  const preview = responsePreview(client.responseMode, client.responseFields);

  const updateOnboarding = (patch: Partial<ClientOnboarding>) => {
    onUpdate({ ...client, onboarding: { ...client.onboarding, ...patch } });
  };

  const updateResponseMode = (mode: ResponseMode) => {
    onUpdate({
      ...client,
      responseMode: mode,
      responseFields: mode === 'Full JSON' ? ['raw_report'] : mode === 'CreditTrust Standard' ? standardResponseFields : client.responseFields,
    });
  };

  const toggleResponseField = (field: string) => {
    const nextFields = client.responseFields.includes(field)
      ? client.responseFields.filter((item) => item !== field)
      : [...client.responseFields, field];
    onUpdate({ ...client, responseMode: 'Custom', responseFields: nextFields });
  };

  return (
    <Modal title={`Manage ${client.name}`} onClose={onClose}>
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <MetricCard label="UAT Credits" value={String(client.uatCredits)} helper="sandbox balance" icon={WalletCards} tone="bg-blue-50 text-blue-700" />
          <MetricCard label="Live Credits" value={String(client.liveCredits)} helper="production balance" icon={WalletCards} tone="bg-emerald-50 text-emerald-700" />
          <MetricCard label="API Keys" value={client.apis.length.toString()} helper={client.apis.join(', ')} icon={KeyRound} tone="bg-violet-50 text-violet-700" />
        </div>

        <div className="rounded-lg border border-border p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-900 text-foreground">Bridge onboarding control</p>
              <p className="mt-1 text-xs font-700 text-muted-foreground">CSR, SSL, UAT validation, sign-off and production promotion are tracked separately.</p>
            </div>
            <StatusPill tone={productionReady(client) ? 'green' : 'blue'}>{onboardingProgress(client)}% ready</StatusPill>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Current stage">
              <select value={client.onboarding.stage} onChange={(event) => updateOnboarding({ stage: event.target.value as OnboardingStage })} className="input-base">
                {(['CSR', 'SSL', 'UAT', 'Sign-Off', 'Production'] as OnboardingStage[]).map((stage) => <option key={stage}>{stage}</option>)}
              </select>
            </Field>
            <Field label="Technical SPOC">
              <input value={client.onboarding.techSpoc} onChange={(event) => updateOnboarding({ techSpoc: event.target.value })} className="input-base" />
            </Field>
            <Field label="Legal entity">
              <input value={client.onboarding.legalEntity} onChange={(event) => updateOnboarding({ legalEntity: event.target.value })} className="input-base" />
            </Field>
            <Field label="SSL common name">
              <input value={client.onboarding.sslCommonName} onChange={(event) => updateOnboarding({ sslCommonName: event.target.value })} className="input-base" />
            </Field>
            <Field label="CSR reference">
              <input value={client.onboarding.csrReference} onChange={(event) => updateOnboarding({ csrReference: event.target.value })} className="input-base" placeholder="CSR ticket / managed TLS note" />
            </Field>
            <Field label="Certificate expiry">
              <input value={client.onboarding.certificateExpiry} onChange={(event) => updateOnboarding({ certificateExpiry: event.target.value })} className="input-base" placeholder="Auto-renewed / YYYY-MM-DD" />
            </Field>
            <Field label="UAT sign-off by">
              <input value={client.onboarding.uatSignoffBy} onChange={(event) => updateOnboarding({ uatSignoffBy: event.target.value })} className="input-base" placeholder="Client approver" />
            </Field>
            <Field label="UAT sign-off date">
              <input value={client.onboarding.uatSignoffAt} onChange={(event) => updateOnboarding({ uatSignoffAt: event.target.value })} className="input-base" placeholder="DD MMM YYYY" />
            </Field>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-slate-50 p-3">
              <p className="text-xs font-900 uppercase tracking-wide text-muted-foreground">UAT static IPs</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {client.onboarding.uatStaticIps.length ? client.onboarding.uatStaticIps.map((item) => (
                  <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-800 text-slate-700">{item}</span>
                )) : <StatusPill tone="amber">Awaiting UAT IP</StatusPill>}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-slate-50 p-3">
              <p className="text-xs font-900 uppercase tracking-wide text-muted-foreground">Production static IPs</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {client.onboarding.productionStaticIps.length ? client.onboarding.productionStaticIps.map((item) => (
                  <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-800 text-slate-700">{item}</span>
                )) : <StatusPill tone="amber">Awaiting production IP</StatusPill>}
              </div>
              <div className="mt-3 flex gap-2">
                <input value={prodIp} onChange={(event) => setProdIp(event.target.value)} className="input-base" placeholder="Add production IP" />
                <button
                  onClick={() => {
                    const clean = prodIp.trim();
                    if (!clean) return;
                    updateOnboarding({ productionStaticIps: [...client.onboarding.productionStaticIps, clean] });
                    onAddIp(client.id, clean);
                    setProdIp('');
                  }}
                  className="rounded-lg bg-slate-950 px-4 text-sm font-900 text-white"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <OnboardingChecklist client={client} onUpdate={onUpdate} />
          </div>
        </div>

        <div className="rounded-lg border border-border p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-900 text-foreground">IP whitelisting policy</p>
              <p className="text-xs font-700 text-muted-foreground">When required, requests from non-listed IPs should be blocked before vendor call.</p>
            </div>
            <button
              onClick={() => onUpdate({ ...client, ipWhitelistingRequired: !client.ipWhitelistingRequired })}
              className={classNames('h-9 rounded-lg px-4 text-xs font-900 text-white', client.ipWhitelistingRequired ? 'bg-emerald-600' : 'bg-amber-500')}
            >
              {client.ipWhitelistingRequired ? 'Required' : 'Optional'}
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {client.ips.length ? client.ips.map((item) => (
              <span key={item} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-800 text-slate-700">
                {item}
                <button onClick={() => onRemoveIp(client.id, item)} className="text-slate-500"><X size={12} /></button>
              </span>
            )) : <StatusPill tone="amber">No IPs added</StatusPill>}
          </div>
          <div className="mt-4 flex gap-2">
            <input value={ip} onChange={(event) => setIp(event.target.value)} className="input-base" placeholder="Add IP address" />
            <button
              onClick={() => {
                onAddIp(client.id, ip);
                if (!client.onboarding.uatStaticIps.includes(ip.trim()) && ip.trim()) {
                  updateOnboarding({ uatStaticIps: [...client.onboarding.uatStaticIps, ip.trim()] });
                }
                setIp('');
              }}
              className="rounded-lg bg-slate-950 px-4 text-sm font-900 text-white"
            >
              Add
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-border p-4">
          <p className="text-sm font-900 text-foreground">Add credits</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <select value={creditEnv} onChange={(event) => setCreditEnv(event.target.value as Environment)} className="input-base">
              <option>UAT</option>
              <option>Production</option>
            </select>
            <input value={credits} onChange={(event) => setCredits(event.target.value)} className="input-base" type="number" min="1" />
            <button
              onClick={() => {
                onAddCredits(client.id, creditEnv, Math.max(1, Number(credits || 1)));
              }}
              className="rounded-lg bg-blue-600 px-4 text-sm font-900 text-white"
            >
              Add Credits
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-border p-4">
          <div>
            <p className="text-sm font-900 text-foreground">Response builder</p>
            <p className="mt-1 text-xs font-700 text-muted-foreground">Is client ko API hit ke baad kya JSON milega yahan set karo.</p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {(['CreditTrust Standard', 'Full JSON', 'Custom'] as ResponseMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => updateResponseMode(mode)}
                className={classNames(
                  'rounded-lg border p-3 text-left transition',
                  client.responseMode === mode ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-border bg-white text-slate-700 hover:bg-slate-50',
                )}
              >
                <p className="text-sm font-900">{mode}</p>
                <p className="mt-1 text-xs font-700">
                  {mode === 'CreditTrust Standard' ? 'Safe fixed schema' : mode === 'Full JSON' ? 'Provider response pass-through' : 'Choose exact fields'}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_0.8fr]">
            <div className={classNames('rounded-lg border border-border bg-slate-50 p-4', client.responseMode !== 'Custom' && 'opacity-60')}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-900 uppercase tracking-wide text-muted-foreground">Allowed fields</p>
                <StatusPill tone={client.responseMode === 'Custom' ? 'blue' : 'slate'}>{effectiveFields.length}</StatusPill>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {responseFieldOptions.map(([field, label]) => {
                  const checked = effectiveFields.includes(field);
                  return (
                    <label key={field} className={classNames('flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-xs font-800', checked ? 'border-blue-200 bg-white text-blue-800' : 'border-transparent bg-white text-slate-600')}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={client.responseMode !== 'Custom'}
                        onChange={() => toggleResponseField(field)}
                        className="mt-0.5"
                      />
                      <span>
                        <span className="block font-900">{field}</span>
                        <span className="block text-muted-foreground">{label}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-white p-4">
              <p className="text-xs font-900 uppercase tracking-wide text-muted-foreground">Response preview</p>
              <pre className="mt-3 max-h-[320px] overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                {JSON.stringify(preview, null, 2)}
              </pre>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {effectiveFields.map((field) => <StatusPill key={field} tone="slate">{field}</StatusPill>)}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <button onClick={() => onCreateKey(client.id)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-900 text-white">Generate API Key</button>
          <button onClick={onClose} className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-900 text-foreground">Done</button>
        </div>
      </div>
    </Modal>
  );
}

function OverviewSection({
  clients,
  keys,
  selectedClientId,
  onNewClient,
  onCreateKey,
  onManage,
  onSelectClient,
}: {
  clients: Client[];
  keys: ApiKeyRecord[];
  selectedClientId?: string;
  onNewClient: () => void;
  onCreateKey: (clientId?: string) => void;
  onManage: (clientId: string) => void;
  onSelectClient: (clientId: string) => void;
}) {
  const activeClients = clients.filter((client) => client.status !== 'Review' && client.status !== 'Suspended').length;
  const productionReadyClients = clients.filter(productionReady).length;
  const ipEnforcedClients = clients.filter((client) => client.ipWhitelistingRequired).length;
  const uatCredits = clients.reduce((sum, client) => sum + client.uatCredits, 0);
  const liveCredits = clients.reduce((sum, client) => sum + client.liveCredits, 0);
  const selectedClient = clients.find((client) => client.id === selectedClientId) || clients[0];
  return (
    <>
      <section className="mb-5 rounded-lg border border-border bg-card shadow-sm">
        <div className="p-5">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-900 uppercase tracking-wide text-blue-700">
            <ShieldCheck size={13} />
            Bridge API Control Plane
          </div>
          <h2 className="text-2xl font-900 tracking-normal text-foreground">Secure client onboarding and API access</h2>
          <p className="mt-2 max-w-3xl text-sm font-700 text-muted-foreground">
            Manage CSR, SSL, IP whitelisting, UAT keys, validation sign-off and production promotion for every Bridge API client.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard label="Clients" value={`${activeClients}`} helper={`${clients.length} total`} icon={Globe2} tone="bg-blue-50 text-blue-700" />
            <MetricCard label="Prod Ready" value={`${productionReadyClients}`} helper="fully gated clients" icon={LockKeyhole} tone="bg-emerald-50 text-emerald-700" />
            <MetricCard label="IP Enforced" value={`${ipEnforcedClients}`} helper="static IP required" icon={ShieldCheck} tone="bg-amber-50 text-amber-700" />
            <MetricCard label="API Keys" value={keys.length.toString()} helper="issued" icon={KeyRound} tone="bg-violet-50 text-violet-700" />
          </div>
        </div>
      </section>

      <section className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <MetricCard label="UAT Credits" value={uatCredits.toLocaleString('en-IN')} helper="sandbox allocation" icon={WalletCards} tone="bg-blue-50 text-blue-700" />
        <MetricCard label="Live Credits" value={liveCredits.toLocaleString('en-IN')} helper="production allocation" icon={WalletCards} tone="bg-emerald-50 text-emerald-700" />
        <MetricCard label="SLA Window" value="99.0%" helper="03:00-04:00 IST excluded" icon={BarChart3} tone="bg-slate-100 text-slate-700" />
      </section>

      <section className="grid grid-cols-1 gap-5 2xl:grid-cols-[1fr_380px]">
        <Panel
          title="Clients"
          action={<button onClick={onNewClient} className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-900 text-white"><Plus size={15} />New Client</button>}
        >
          <ClientsTable clients={clients} selectedClientId={selectedClient?.id} onSelect={onSelectClient} onManage={onManage} onCreateKey={onCreateKey} />
        </Panel>
        <div className="space-y-5">
          <ClientDetailPanel client={selectedClient} keys={keys} onManage={onManage} onCreateKey={onCreateKey} />
        </div>
      </section>
    </>
  );
}

function DocsPanel({ clients, keys }: { clients: Client[]; keys: ApiKeyRecord[] }) {
  const clientById = new Map(clients.map((client) => [client.id, client]));
  const downloadableKeys = keys.filter((key) => clientById.has(key.clientId));

  const downloadAllDocs = () => {
    const content = downloadableKeys
      .map((key) => buildApiDoc(clientById.get(key.clientId)!, key))
      .join('\n\n----------------------------------------\n\n');
    downloadTextFile('credittrust-api-docs-all-clients.txt', content || 'No API keys created yet.');
  };

  return (
    <div className="space-y-5">
      <Panel
        title="API Docs"
        action={<button onClick={downloadAllDocs} className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-900 text-white"><Download size={15} />Download All</button>}
      >
        <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-3">
          {apiProducts.map((api) => (
            <div key={api} className="rounded-lg border border-border bg-slate-50 p-4">
              <p className="text-sm font-900 text-foreground">{api}</p>
              <div className="mt-3 space-y-2">
                {environments.map((environment) => (
                  <div key={environment} className="rounded-lg bg-white px-3 py-2">
                    <p className="text-[10px] font-900 uppercase tracking-wide text-muted-foreground">{environment}</p>
                    <p className="mt-1 break-all text-xs font-900 text-foreground">{endpointFor(api, environment)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Client Keys">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-slate-50">
              <tr>
                {['Client', 'Environment', 'API', 'Key', 'Doc'].map((head) => (
                  <th key={head} className="px-4 py-3 text-left text-[11px] font-900 uppercase tracking-wide text-slate-500">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {downloadableKeys.map((key) => {
                const client = clientById.get(key.clientId)!;
                return (
                  <tr key={key.id} className="bg-white">
                    <td className="px-4 py-4">
                      <p className="text-sm font-900 text-foreground">{client.name}</p>
                      <p className="text-xs font-700 text-muted-foreground">{client.contactEmail}</p>
                    </td>
                    <td className="px-4 py-4"><StatusPill tone={key.environment === 'Production' ? 'green' : 'blue'}>{key.environment}</StatusPill></td>
                    <td className="px-4 py-4"><StatusPill tone="slate">{key.api}</StatusPill></td>
                    <td className="px-4 py-4">
                      <div className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-800 text-white">
                        {maskedKeyValue(key)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => downloadTextFile(`${client.name.replace(/\s+/g, '-').toLowerCase()}-${key.environment.toLowerCase()}-${key.api.replace(/\s+/g, '-').toLowerCase()}-api-doc.txt`, buildApiDoc(client, key))}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-3 text-xs font-900 text-foreground"
                      >
                        <Download size={14} />
                        Download
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!downloadableKeys.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-sm font-800 text-muted-foreground">No keys created yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function ticketTone(status: SupportTicket['status']): 'blue' | 'green' | 'amber' | 'red' | 'slate' {
  if (status === 'resolved' || status === 'closed') return 'green';
  if (status === 'in_progress') return 'blue';
  if (status === 'open') return 'amber';
  return 'slate';
}

function priorityTone(priority: SupportTicket['priority']): 'blue' | 'green' | 'amber' | 'red' | 'slate' {
  if (priority === 'critical') return 'red';
  if (priority === 'high') return 'amber';
  if (priority === 'medium') return 'blue';
  return 'slate';
}

function SupportPanel({
  clients,
  tickets,
  onUpdateTicket,
}: {
  clients: Client[];
  tickets: SupportTicket[];
  onUpdateTicket: (ticketId: string, patch: Partial<SupportTicket>) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, { internal_note: string; last_response: string }>>({});
  const clientById = new Map(clients.map((client) => [client.id, client]));
  const openTickets = tickets.filter((ticket) => ticket.status === 'open' || ticket.status === 'in_progress');
  const criticalTickets = tickets.filter((ticket) => ticket.priority === 'critical' && ticket.status !== 'closed');

  const draftFor = (ticket: SupportTicket) => drafts[ticket.id] || {
    internal_note: ticket.internal_note || '',
    last_response: ticket.last_response || '',
  };

  const updateDraft = (ticket: SupportTicket, patch: Partial<{ internal_note: string; last_response: string }>) => {
    setDrafts((current) => ({ ...current, [ticket.id]: { ...draftFor(ticket), ...patch } }));
  };

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MetricCard label="Open Tickets" value={openTickets.length.toString()} helper="needs action" icon={LifeBuoy} tone="bg-amber-50 text-amber-700" />
        <MetricCard label="Critical" value={criticalTickets.length.toString()} helper="priority queue" icon={ShieldCheck} tone="bg-red-50 text-red-700" />
        <MetricCard label="Total Tickets" value={tickets.length.toString()} helper="all client requests" icon={BarChart3} tone="bg-blue-50 text-blue-700" />
      </section>

      <Panel title="Support Tickets">
        <div className="divide-y divide-border">
          {tickets.length ? tickets.map((ticket) => {
            const client = clientById.get(ticket.client_id);
            const clientName = client?.name || ticket.client_name || 'Client';
            const draft = draftFor(ticket);
            return (
              <div key={ticket.id} className="p-4">
                <div className="grid gap-3 xl:grid-cols-[1fr_300px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={ticketTone(ticket.status)}>{ticket.status.replace(/_/g, ' ')}</StatusPill>
                      <StatusPill tone={priorityTone(ticket.priority)}>{ticket.priority}</StatusPill>
                      <StatusPill tone="slate">{ticket.category.replace(/_/g, ' ')}</StatusPill>
                      <span className="text-xs font-900 text-muted-foreground">{ticket.ticket_number}</span>
                    </div>
                    <h3 className="mt-2 text-base font-900 text-foreground">{ticket.subject}</h3>
                    <p className="mt-1 text-xs font-800 text-muted-foreground">
                      {clientName} - {ticket.client_email || client?.contactEmail || '-'} - {new Date(ticket.created_at).toLocaleString('en-IN')}
                    </p>
                    {ticket.request_id ? <p className="mt-2 font-mono text-xs font-900 text-blue-700">Request ID: {ticket.request_id}</p> : null}
                    <p className="mt-3 max-h-24 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-slate-50 p-3 text-sm font-700 leading-5 text-slate-700">{ticket.message}</p>
                    {ticket.last_response ? (
                      <div className="mt-3 max-h-20 overflow-y-auto rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm font-800 leading-5 text-emerald-800">
                        Last client response: {ticket.last_response}
                      </div>
                    ) : null}
                    {ticket.thread?.length ? (
                      <div className="mt-3 max-h-44 space-y-2 overflow-y-auto rounded-lg border border-border bg-white p-3">
                        {ticket.thread.map((entry) => (
                          <div key={entry.id} className="rounded-lg bg-slate-50 p-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-900 uppercase tracking-wide text-slate-500">{entry.author}</span>
                              <span className="text-[10px] font-800 text-slate-400">{new Date(entry.created_at).toLocaleString('en-IN')}</span>
                            </div>
                            <p className="mt-1 whitespace-pre-wrap text-xs font-800 leading-5 text-slate-700">{entry.message}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="rounded-lg border border-border bg-slate-50 p-3">
                    <label className="block">
                      <span className="text-[10px] font-900 uppercase tracking-wide text-muted-foreground">Status</span>
                      <select
                        value={ticket.status}
                        onChange={(event) => onUpdateTicket(ticket.id, { status: event.target.value as SupportTicket['status'] })}
                        className="mt-1.5 h-9 w-full rounded-lg border border-border bg-white px-3 text-sm font-900"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </label>
                    <label className="mt-2 block">
                      <span className="text-[10px] font-900 uppercase tracking-wide text-muted-foreground">Internal note</span>
                      <textarea
                        value={draft.internal_note}
                        onChange={(event) => updateDraft(ticket, { internal_note: event.target.value })}
                        className="mt-1.5 h-16 w-full resize-none rounded-lg border border-border bg-white p-2.5 text-sm font-800"
                        placeholder="Visible only to FinCoopers operators"
                      />
                    </label>
                    <label className="mt-2 block">
                      <span className="text-[10px] font-900 uppercase tracking-wide text-muted-foreground">Client response</span>
                      <textarea
                        value={draft.last_response}
                        onChange={(event) => updateDraft(ticket, { last_response: event.target.value })}
                        className="mt-1.5 h-16 w-full resize-none rounded-lg border border-border bg-white p-2.5 text-sm font-800"
                        placeholder={`Visible to ${clientName} in client portal`}
                      />
                    </label>
                    <button
                      onClick={() => onUpdateTicket(ticket.id, draft)}
                      className="mt-2 h-9 w-full rounded-lg bg-blue-600 text-xs font-900 text-white"
                    >
                      Save Ticket
                    </button>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="px-4 py-8 text-center text-sm font-800 text-muted-foreground">No support tickets yet.</div>
          )}
        </div>
      </Panel>
    </div>
  );
}

function ActiveSection({
  activeNav,
  clients,
  keys,
  tickets,
  selectedClientId,
  onNewClient,
  onCreateKey,
  onDeleteKey,
  onDeleteUatKeys,
  onToggleKeyStatus,
  onManage,
  onSelectClient,
  onRemoveIp,
  onAddIp,
  onUpdateClient,
  onAddCredits,
  onUpdateTicket,
  revealedSecrets,
}: {
  activeNav: NavItem;
  clients: Client[];
  keys: ApiKeyRecord[];
  tickets: SupportTicket[];
  selectedClientId?: string;
  onNewClient: () => void;
  onCreateKey: (clientId?: string) => void;
  onDeleteKey: (keyId: string) => void;
  onDeleteUatKeys: (clientId: string) => void;
  onToggleKeyStatus: (key: ApiKeyRecord) => void;
  onManage: (clientId: string) => void;
  onSelectClient: (clientId: string) => void;
  onRemoveIp: (clientId: string, ip: string) => void;
  onAddIp: (clientId: string, ip: string) => void;
  onUpdateClient: (client: Client) => void;
  onAddCredits: (clientId: string, environment: Environment, credits: number) => void;
  onUpdateTicket: (ticketId: string, patch: Partial<SupportTicket>) => void;
  revealedSecrets: Record<string, string>;
}) {
  if (activeNav === 'Overview') {
    return (
      <OverviewSection
        clients={clients}
        keys={keys}
        selectedClientId={selectedClientId}
        onNewClient={onNewClient}
        onCreateKey={onCreateKey}
        onManage={onManage}
        onSelectClient={onSelectClient}
      />
    );
  }

  if (activeNav === 'Onboarding') {
    return <OnboardingBoard clients={clients} onManage={onManage} />;
  }

  if (activeNav === 'Clients') {
    const selectedClient = clients.find((client) => client.id === selectedClientId) || clients[0];
    return (
      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[1fr_420px]">
        <Panel
          title="Client Management"
          action={<button onClick={onNewClient} className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-900 text-white"><Plus size={15} />New Client</button>}
        >
          <ClientsTable clients={clients} selectedClientId={selectedClient?.id} onSelect={onSelectClient} onManage={onManage} onCreateKey={onCreateKey} />
        </Panel>
        <ClientDetailPanel client={selectedClient} keys={keys} onManage={onManage} onCreateKey={onCreateKey} />
      </div>
    );
  }

  if (activeNav === 'Environments') {
    return (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {environments.map((environment) => {
          const totalCredits = clients.reduce((sum, client) => sum + (environment === 'Production' ? client.liveCredits : client.uatCredits), 0);
          const environmentKeys = keys.filter((key) => key.environment === environment);
          const environmentClients = clients.filter((client) =>
            environment === 'Production'
              ? client.status === 'Production'
              : client.status === 'UAT' || client.status === 'Review' || client.uatCredits > 0,
          );
          const docs = environment === 'Production'
            ? [
              ['Base URL', 'https://api.credittrust.in'],
              ['Standard', 'POST /api/v1/bureau'],
              ['Advanced', 'POST /api/v1/bureau-advanced'],
            ]
            : [
              ['Base URL', 'https://api.credittrust.in'],
              ['Standard UAT', 'POST /api/v1/bureau?env=uat'],
              ['Advanced UAT', 'POST /api/v1/bureau-advanced?env=uat'],
            ];
          return (
            <div key={environment} className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-900 text-foreground">{environment} Environment</h3>
                </div>
                <StatusPill tone={environment === 'Production' ? 'green' : 'blue'}>Active</StatusPill>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-slate-50 p-3">
                  <p className="text-[10px] font-900 uppercase tracking-wide text-muted-foreground">Credits</p>
                  <p className="mt-2 text-2xl font-900 text-foreground">{totalCredits.toLocaleString('en-IN')}</p>
                </div>
                <div className="rounded-lg border border-border bg-slate-50 p-3">
                  <p className="text-[10px] font-900 uppercase tracking-wide text-muted-foreground">Keys</p>
                  <p className="mt-2 text-2xl font-900 text-foreground">{environmentKeys.length}</p>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-border bg-slate-50 p-3">
                <p className="text-[10px] font-900 uppercase tracking-wide text-muted-foreground">{environment} Docs</p>
                <div className="mt-3 space-y-2">
                  {docs.map(([label, value]) => (
                    <div key={label} className="flex flex-col gap-1 rounded-lg bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-xs font-900 text-muted-foreground">{label}</span>
                      <span className="break-all text-xs font-900 text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-border bg-white">
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <p className="text-xs font-900 uppercase tracking-wide text-muted-foreground">Clients</p>
                  <StatusPill tone="slate">{environmentClients.length}</StatusPill>
                </div>
                <div className="divide-y divide-border">
                  {environmentClients.length ? environmentClients.map((client) => (
                    <div key={client.id} className="flex items-center justify-between gap-3 px-3 py-3">
                      <div>
                        <p className="text-sm font-900 text-foreground">{client.name}</p>
                        <p className="text-xs font-700 text-muted-foreground">{client.country}</p>
                      </div>
                      <StatusPill tone={client.status === 'Production' ? 'green' : client.status === 'UAT' ? 'blue' : 'amber'}>{client.status}</StatusPill>
                    </div>
                  )) : (
                    <div className="px-3 py-4 text-sm font-800 text-muted-foreground">No clients</div>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-border bg-white">
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <p className="text-xs font-900 uppercase tracking-wide text-muted-foreground">Keys</p>
                  <StatusPill tone="slate">{environmentKeys.length}</StatusPill>
                </div>
                <div className="divide-y divide-border">
                  {environmentKeys.length ? environmentKeys.map((key) => {
                    const client = clients.find((item) => item.id === key.clientId);
                    return (
                      <div key={key.id} className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-900 text-foreground">{client?.name || 'Unknown client'}</p>
                          <p className="text-xs font-700 text-muted-foreground">{key.api}</p>
                        </div>
                        <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-900 text-slate-700 break-all">{maskedKeyValue(key)}</span>
                      </div>
                    );
                  }) : (
                    <div className="px-3 py-4 text-sm font-800 text-muted-foreground">No keys</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (activeNav === 'API Keys') {
    return (
      <ClientKeyDirectory
        keys={keys}
        clients={clients}
        onCreateKey={onCreateKey}
        onDeleteKey={onDeleteKey}
        onDeleteUatKeys={onDeleteUatKeys}
        onToggleKeyStatus={onToggleKeyStatus}
        revealedSecrets={revealedSecrets}
      />
    );
  }

  if (activeNav === 'IP Whitelist') {
    return (
      <Panel title="IP Whitelist">
        <div className="divide-y divide-border">
          {clients.map((client) => (
            <div key={client.id} className="p-4">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[0.9fr_0.8fr_1.4fr_auto] lg:items-center">
                <div>
                  <p className="text-sm font-900 text-foreground">{client.name}</p>
                  <p className="text-xs font-700 text-muted-foreground">{client.country}</p>
                </div>
                <button
                  onClick={() => onUpdateClient({ ...client, ipWhitelistingRequired: !client.ipWhitelistingRequired })}
                  className={classNames('h-9 rounded-lg px-3 text-xs font-900 text-white', client.ipWhitelistingRequired ? 'bg-emerald-600' : 'bg-amber-500')}
                >
                  {client.ipWhitelistingRequired ? 'Required' : 'Optional'}
                </button>
                <div className="flex flex-wrap gap-2">
                  {client.ips.length ? client.ips.map((ip) => (
                    <span key={ip} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-800 text-slate-700">
                      {ip}
                      <button onClick={() => onRemoveIp(client.id, ip)}><X size={12} /></button>
                    </span>
                  )) : <StatusPill tone="amber">No IPs added</StatusPill>}
                </div>
                <button onClick={() => onManage(client.id)} className="h-9 rounded-lg border border-border bg-white px-3 text-xs font-900 text-foreground">Update IPs</button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    );
  }

  if (activeNav === 'Credits') {
    const uatCredits = clients.reduce((sum, client) => sum + client.uatCredits, 0);
    const liveCredits = clients.reduce((sum, client) => sum + client.liveCredits, 0);
    return (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="UAT Credits" value={uatCredits.toLocaleString('en-IN')} helper="across clients" icon={WalletCards} tone="bg-blue-50 text-blue-700" />
          <MetricCard label="Live Credits" value={liveCredits.toLocaleString('en-IN')} helper="production balance" icon={WalletCards} tone="bg-emerald-50 text-emerald-700" />
        </div>
        <Panel title="Client Credit Control">
          <div className="divide-y divide-border">
            {clients.map((client) => (
              <div key={client.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-900 text-foreground">{client.name}</p>
                  <p className="text-xs font-700 text-muted-foreground">UAT {client.uatCredits} - Production {client.liveCredits}</p>
                </div>
                <button onClick={() => onManage(client.id)} className="h-9 rounded-lg bg-blue-600 px-3 text-xs font-900 text-white">Manage Credits</button>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    );
  }

  if (activeNav === 'Support') {
    return <SupportPanel clients={clients} tickets={tickets} onUpdateTicket={onUpdateTicket} />;
  }

  if (activeNav === 'Docs') {
    return <DocsPanel clients={clients} keys={keys} />;
  }

  return null;
}

export default function ApiConsolePage() {
  const [activeNav, setActiveNav] = useState<NavItem>('Overview');
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [keys, setKeys] = useState<ApiKeyRecord[]>(initialKeys);
  const [logs, setLogs] = useState<UsageLog[]>(initialLogs);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [hubApis, setHubApis] = useState<HubApiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [keyModalClientId, setKeyModalClientId] = useState<string | undefined>();
  const [managedClientId, setManagedClientId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState(initialClients[0]?.id);
  const [latestSecret, setLatestSecret] = useState('');
  const [latestKeyId, setLatestKeyId] = useState('');
  const [latestSecretVisible, setLatestSecretVisible] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [loginUsername, setLoginUsername] = useState('bridge-admin');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const managedClient = clients.find((client) => client.id === managedClientId) || null;
  const revealedSecrets = useMemo(() => (
    latestKeyId && latestSecret ? { [latestKeyId]: latestSecret } : {}
  ), [latestKeyId, latestSecret]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin-api-hub?usage_page_size=10');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Unable to load Bridge console data');
      setAuthenticated(true);
      const data: HubData = {
        apis: json.apis || [],
        clients: json.clients || [],
        keys: json.keys || [],
        tickets: json.tickets || [],
      };
      const bridgeClients = data.clients.filter(isBridgeConsoleClient);
      const bridgeClientIds = new Set(bridgeClients.map((client) => client.id));
      const bridgeKeys = data.keys.filter((key) => bridgeClientIds.has(key.client_id));
      const mappedKeys = bridgeKeys.map((key) => mapHubKey(key, data.apis));
      const mappedClients = bridgeClients.map((client) => mapHubClient(client, bridgeKeys, data.apis));
      setHubApis(data.apis);
      setKeys(mappedKeys);
      setClients(mappedClients);
      setTickets(data.tickets);
      setLogs([]);
      setSelectedClientId((current) => current && mappedClients.some((client) => client.id === current)
        ? current
        : mappedClients[0]?.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load Bridge console data';
      if (message === 'Unauthorized') setAuthenticated(false);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/hub-console-auth/session');
        const json = await response.json();
        setAuthenticated(Boolean(json.authenticated));
        if (!json.configured) setError('Bridge console login is not configured.');
        if (json.authenticated) await loadData();
        else setLoading(false);
      } catch {
        setError('Unable to verify Bridge console session.');
        setLoading(false);
      } finally {
        setAuthChecked(true);
      }
    };
    checkSession();
  }, []);

  const login = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginLoading(true);
    setError('');
    try {
      const response = await fetch('/api/hub-console-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Unable to login');
      setAuthenticated(true);
      setLoginPassword('');
      await loadData();
    } catch (err) {
      setAuthenticated(false);
      setError(err instanceof Error ? err.message : 'Bridge console login failed');
    } finally {
      setLoginLoading(false);
      setAuthChecked(true);
    }
  };

  const logout = async () => {
    await fetch('/api/hub-console-auth/logout', { method: 'POST' });
    setAuthenticated(false);
    setClients([]);
    setKeys([]);
    setTickets([]);
    setLogs([]);
    setNotice('');
  };

  const [pendingClientSave, setPendingClientSave] = useState<Client | null>(null);

  const authPost = async (
    payload: Record<string, unknown>,
    options: { reload?: boolean; quiet?: boolean } = {},
  ) => {
    const { reload = true, quiet = false } = options;
    setSaving(true);
    setError('');
    if (!quiet) setNotice('');
    try {
      const response = await fetch('/api/admin-api-hub', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Bridge console action failed');
      if (reload) await loadData();
      return json;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bridge console action failed');
      return null;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!pendingClientSave) return;
    const timeout = setTimeout(() => {
      authPost(clientToHubPayload(pendingClientSave), { reload: false, quiet: true }).then((json) => {
        if (json?.success) setNotice('Client setup autosaved.');
      });
      setPendingClientSave(null);
    }, 650);
    return () => clearTimeout(timeout);
  }, [pendingClientSave]);

  const addClient = async (client: Client) => {
    const json = await authPost({
      action: 'create_client',
      name: client.name,
      company_name: client.onboarding.legalEntity || client.name,
      contact_name: client.onboarding.techSpoc || client.contactEmail,
      email: client.contactEmail,
      allowed_ips: client.ips.join(','),
      credits: client.uatCredits,
      metadata: clientToHubPayload(client).metadata,
    });
    if (!json?.success) return;
    setSelectedClientId(json.client?.id);
    setClientModalOpen(false);
    setActiveNav('Clients');
    setNotice('Client created in Bridge backend.');
  };

  const updateClient = (client: Client) => {
    setClients((prev) => prev.map((item) => item.id === client.id ? client : item));
    setPendingClientSave(client);
  };

  const addIp = async (clientId: string, ip: string) => {
    const cleanIp = ip.trim();
    if (!cleanIp) return;
    const client = clients.find((item) => item.id === clientId);
    if (!client || client.ips.includes(cleanIp)) return;
    updateClient({ ...client, ips: [...client.ips, cleanIp] });
  };

  const removeIp = async (clientId: string, ip: string) => {
    const client = clients.find((item) => item.id === clientId);
    if (!client) return;
    updateClient({ ...client, ips: client.ips.filter((item) => item !== ip) });
  };

  const addCredits = async (clientId: string, environment: Environment, credits: number) => {
    const json = await authPost({
      action: 'add_credits',
      client_id: clientId,
      credits,
      environment: environment === 'Production' ? 'production' : 'uat',
    });
    if (json?.success) setNotice(`${environment} credits added.`);
  };

  const createKey = async (key: ApiKeyRecord) => {
    const json = await authPost({
      action: 'generate_key',
      client_id: key.clientId,
      api_id: apiIdForProduct(key.api, hubApis),
      environment: key.environment === 'Production' ? 'production' : 'uat',
      label: key.label,
    });
    if (!json?.success) return;
    setLatestSecret(json.secret_key || '');
    setLatestKeyId(json.api_key?.id || '');
    setLatestSecretVisible(false);
    setKeyModalClientId(undefined);
    setActiveNav('API Keys');
    setNotice('Client API key generated. Use the eye icon to reveal it only when needed.');
  };

  const deleteKey = async (keyId: string) => {
    if (!window.confirm('Delete this API key from Bridge Console?')) return;
    const json = await authPost({ action: 'delete_key', key_id: keyId });
    if (json?.success) {
      if (latestKeyId === keyId) {
        setLatestSecret('');
        setLatestKeyId('');
      }
      setNotice('API key deleted.');
    }
  };

  const deleteUatKeys = async (clientId: string) => {
    if (!window.confirm('Delete all UAT API keys for this client?')) return;
    const json = await authPost({ action: 'delete_uat_keys', client_id: clientId });
    if (json?.success) {
      setLatestSecret('');
      setLatestKeyId('');
      setNotice(`${json.deleted_count || 0} UAT API key(s) deleted.`);
    }
  };

  const toggleKeyStatus = async (key: ApiKeyRecord) => {
    const nextStatus = key.status === 'Active' ? 'inactive' : 'active';
    const json = await authPost({ action: 'set_key_status', key_id: key.id, status: nextStatus });
    if (json?.success) setNotice(`API key marked ${nextStatus === 'active' ? 'active' : 'inactive'}.`);
  };

  const updateTicket = async (ticketId: string, patch: Partial<SupportTicket>) => {
    const json = await authPost({
      action: 'update_ticket',
      ticket_id: ticketId,
      status: patch.status,
      internal_note: patch.internal_note,
      last_response: patch.last_response,
    });
    if (json?.success) setNotice('Support ticket updated.');
  };

  if (!authChecked || (loading && !authenticated)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-emerald-300 border-t-transparent" />
          <p className="text-sm font-800 text-slate-300">Checking Bridge console session...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-950 px-5 py-10 text-white">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
          <div className="grid w-full overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl lg:grid-cols-[1fr_0.85fr]">
            <div className="bg-slate-950 p-8 text-white lg:p-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400 text-lg font-900 text-slate-950">CT</div>
              <p className="mt-8 text-xs font-900 uppercase tracking-[0.35em] text-emerald-300">hub.credittrust.in</p>
              <h1 className="mt-3 text-4xl font-900 leading-tight">Bridge API Control Plane</h1>
              <p className="mt-4 max-w-md text-sm font-600 leading-6 text-slate-300">
                Separate operator access for Binta onboarding, API credentials, IP allowlisting, UAT validation and production promotion.
              </p>
              <div className="mt-8 grid gap-3 text-sm font-800 text-slate-200">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"><ShieldCheck size={18} className="text-emerald-300" /> Independent console login</div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"><LockKeyhole size={18} className="text-blue-300" /> Signed httpOnly session cookie</div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"><KeyRound size={18} className="text-amber-300" /> One-time API key reveal</div>
              </div>
            </div>
            <form onSubmit={login} className="bg-slate-50 p-8 text-slate-950 lg:p-10">
              <p className="text-xs font-900 uppercase tracking-[0.25em] text-blue-700">Operator Login</p>
              <h2 className="mt-3 text-2xl font-900">Sign in to Bridge</h2>
              <p className="mt-2 text-sm font-600 text-slate-500">Use the dedicated Bridge console credentials. CreditTrust portal login is not used here.</p>
              {error ? (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-800 text-red-800">{error}</div>
              ) : null}
              <label className="mt-6 block text-sm font-900 text-slate-700">
                Username
                <input
                  value={loginUsername}
                  onChange={(event) => setLoginUsername(event.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-800 outline-none focus:border-blue-500"
                  autoComplete="username"
                />
              </label>
              <label className="mt-4 block text-sm font-900 text-slate-700">
                Password
                <input
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  type="password"
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-800 outline-none focus:border-blue-500"
                  autoComplete="current-password"
                />
              </label>
              <button disabled={loginLoading} className="mt-6 h-12 w-full rounded-xl bg-blue-600 text-sm font-900 text-white shadow-lg shadow-blue-600/20 disabled:cursor-not-allowed disabled:opacity-60">
                {loginLoading ? 'Signing in...' : 'Open Bridge Console'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-foreground">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[260px] border-r border-slate-800 bg-slate-950 text-white lg:flex lg:flex-col">
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500 text-base font-900 text-slate-950">CT</div>
          <div>
            <p className="text-base font-900 leading-tight">CreditTrust Bridge</p>
            <p className="text-xs font-600 text-slate-400">Control Plane</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {navItems.map((item) => (
            <button
              key={item}
              onClick={() => setActiveNav(item)}
              className={classNames(
                'flex h-11 w-full items-center justify-between rounded-lg px-3 text-left text-sm font-700 transition',
                activeNav === item ? 'bg-white text-slate-950' : 'text-slate-400 hover:bg-white/10 hover:text-white',
              )}
            >
              <span>{item}</span>
              {activeNav === item && <ArrowRight size={15} />}
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-lg bg-white/5 p-3">
            <p className="text-xs font-800 uppercase tracking-wide text-slate-400">Security posture</p>
            <div className="mt-3 flex items-center gap-2 text-sm font-800 text-emerald-300">
              <CheckCircle2 size={16} />
              IP gated
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm font-800 text-blue-300">
              <LockKeyhole size={16} />
              2FA ready
            </div>
          </div>
        </div>
      </aside>

      <main className="lg:pl-[260px]">
        <header className="sticky top-0 z-10 border-b border-border bg-white/90 px-4 py-4 backdrop-blur lg:px-8">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-900 uppercase tracking-wide text-blue-700">hub.credittrust.in</p>
              <h1 className="text-2xl font-900 tracking-normal text-foreground">Bridge API Control Plane</h1>
              <p className="mt-1 text-xs font-700 text-muted-foreground">Operator-only console for client onboarding, credentials, IP allowlisting and go-live controls.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-900 text-emerald-700">
                <ShieldCheck size={15} />
                {loading ? 'Loading Backend' : 'Backend Synced'}
              </span>
              <button disabled={saving} onClick={() => setClientModalOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-800 text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60">
                <KeyRound size={16} />
                Create Client
              </button>
              <button onClick={logout} className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-900 text-slate-600 hover:bg-slate-50">
                Logout
              </button>
            </div>
          </div>
          {error ? (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-800 text-red-800">
              {error}
            </div>
          ) : null}
          {notice ? (
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-800 text-blue-800">
              {notice}
            </div>
          ) : null}
          {latestSecret ? (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-800 text-emerald-800">
              Key generated: <span className="font-mono font-900">{latestSecretVisible ? latestSecret : '*'.repeat(Math.min(32, latestSecret.length || 32))}</span>
              <button
                className="ml-3 rounded-md border border-emerald-200 bg-white px-2 py-1 text-xs font-900 text-emerald-800"
                onClick={() => setLatestSecretVisible((current) => !current)}
              >
                {latestSecretVisible ? 'Hide' : 'Show'}
              </button>
              <button
                className="ml-3 rounded-md border border-emerald-200 bg-white px-2 py-1 text-xs font-900 text-emerald-800"
                onClick={() => navigator.clipboard?.writeText(latestSecret)}
              >
                Copy once
              </button>
            </div>
          ) : null}
        </header>

        <div className="px-4 py-6 lg:px-8">
          {loading ? (
            <div className="rounded-lg border border-border bg-white p-8 text-center text-sm font-900 text-muted-foreground shadow-sm">
              Loading Bridge backend...
            </div>
          ) : (
            <ActiveSection
              activeNav={activeNav}
              clients={clients}
              keys={keys}
              tickets={tickets}
              selectedClientId={selectedClientId}
              onNewClient={() => setClientModalOpen(true)}
              onCreateKey={(clientId) => setKeyModalClientId(clientId || '')}
              onDeleteKey={deleteKey}
              onDeleteUatKeys={deleteUatKeys}
              onToggleKeyStatus={toggleKeyStatus}
              onManage={(clientId) => {
                setSelectedClientId(clientId);
                setManagedClientId(clientId);
              }}
              onSelectClient={setSelectedClientId}
              onRemoveIp={removeIp}
              onAddIp={addIp}
              onUpdateClient={updateClient}
              onAddCredits={addCredits}
              onUpdateTicket={updateTicket}
              revealedSecrets={revealedSecrets}
            />
          )}
        </div>
      </main>

      {clientModalOpen ? (
        <Modal title="Create New API Client" onClose={() => setClientModalOpen(false)}>
          <ClientForm onSubmit={addClient} onCancel={() => setClientModalOpen(false)} />
        </Modal>
      ) : null}

      {keyModalClientId !== undefined ? (
        <Modal title="Generate Client API Key" onClose={() => setKeyModalClientId(undefined)}>
          <KeyForm clients={clients} initialClientId={keyModalClientId || undefined} onSubmit={createKey} onCancel={() => setKeyModalClientId(undefined)} />
        </Modal>
      ) : null}

      {managedClient ? (
        <ManageClientModal
          client={managedClient}
          onClose={() => setManagedClientId(null)}
          onUpdate={updateClient}
          onAddIp={addIp}
          onRemoveIp={removeIp}
          onAddCredits={addCredits}
          onCreateKey={(clientId) => setKeyModalClientId(clientId)}
        />
      ) : null}
    </div>
  );
}
