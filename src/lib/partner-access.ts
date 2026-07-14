export const PARTNER_PRODUCT_ACCESS_VALUES = ['bureau_portal', 'dsa_crm'] as const;

export type PartnerProductAccess = (typeof PARTNER_PRODUCT_ACCESS_VALUES)[number];

export const PARTNER_PRODUCT_ACCESS_LABELS: Record<PartnerProductAccess, string> = {
  bureau_portal: 'Bureau Portal',
  dsa_crm: 'CreditTrust CRM',
};

export function normalizePartnerProductAccess(value: unknown): PartnerProductAccess {
  return value === 'dsa_crm' ? 'dsa_crm' : 'bureau_portal';
}

export function getPartnerLandingPath(access: unknown): string {
  return normalizePartnerProductAccess(access) === 'dsa_crm' ? '/crm' : '/partner-dashboard';
}
