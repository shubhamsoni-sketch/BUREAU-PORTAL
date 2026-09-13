import type { User } from '@supabase/supabase-js';

export type LenderIntelligenceCapability =
  | 'intelligence.read'
  | 'catalog.read'
  | 'policy.manage'
  | 'routing.review'
  | 'finance.read'
  | 'finance.manage'
  | 'compliance.read'
  | 'compliance.manage';

export function hasLenderIntelligenceCapability(
  user: User,
  capability: LenderIntelligenceCapability
) {
  const configured = user.app_metadata?.lender_intelligence_permissions;
  if (!Array.isArray(configured)) return false;
  const permissions = new Set(
    configured.filter((value): value is string => typeof value === 'string')
  );
  return permissions.has('*') || permissions.has(capability);
}

export function requireLenderIntelligenceCapability(
  user: User,
  capability: LenderIntelligenceCapability
) {
  return hasLenderIntelligenceCapability(user, capability)
    ? null
    : { error: `Lender Intelligence permission required: ${capability}`, status: 403 as const };
}
