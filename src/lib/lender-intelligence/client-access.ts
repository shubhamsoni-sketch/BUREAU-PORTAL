export type LenderIntelligenceClientUser = {
  lenderIntelligencePermissions?: string[];
} | null;

export function hasLenderIntelligenceClientPermission(
  user: LenderIntelligenceClientUser,
  permission: string
) {
  const permissions = new Set(user?.lenderIntelligencePermissions || []);
  return permissions.has('*') || permissions.has(permission);
}

export function lenderIntelligenceBackPath(user: LenderIntelligenceClientUser) {
  return hasLenderIntelligenceClientPermission(user, 'intelligence.read')
    ? '/admin-lender-intelligence'
    : '/admin-dashboard';
}
