import { CrmScope } from '@/lib/crm/scope';
import {
  CrmPermissionKey,
  CrmTeamMember,
  normalizeTeam,
  rolePermissions,
} from '@/lib/crm/team';

type CrmStoreLike = {
  team?: unknown;
};

export type CrmAccessResult =
  | { ok: true; actor: CrmTeamMember | null }
  | { ok: false; error: string; status: number };

export function requireCrmPermission(
  scope: CrmScope,
  store: CrmStoreLike,
  permission: CrmPermissionKey
): CrmAccessResult {
  if (scope.isDemo) return { ok: true, actor: null };
  if (scope.isPartnerOwner) return { ok: true, actor: null };
  if (!scope.userId && !scope.userEmail) {
    return { ok: false, error: 'CRM login required', status: 401 };
  }

  const team = normalizeTeam(store.team);
  const actor = team.find(
    (member) =>
      (scope.userId && member.authUserId === scope.userId) ||
      (scope.userEmail && member.email.toLowerCase() === scope.userEmail.toLowerCase())
  );

  if (!actor) return { ok: false, error: 'CRM user is not linked to this partner', status: 403 };
  if (actor.status !== 'active') return { ok: false, error: 'CRM user is inactive', status: 403 };

  const permissions = actor.permissions?.length ? actor.permissions : rolePermissions[actor.role];
  if (!permissions.includes(permission)) {
    return { ok: false, error: 'You do not have access to this CRM module', status: 403 };
  }

  return { ok: true, actor };
}
