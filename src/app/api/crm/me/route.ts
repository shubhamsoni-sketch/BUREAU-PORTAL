import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveCrmScope } from '@/lib/crm/scope';
import { initials, normalizeTeam, rolePermissions } from '@/lib/crm/team';
import { getCrmTableData } from '@/lib/crm/db';

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const scope = await resolveCrmScope(request, supabase);

    if (scope.isDemo) {
      return NextResponse.json({ success: true, data: null, scope });
    }

    if (scope.isPartnerOwner) {
      return NextResponse.json({
        success: true,
        data: {
          name: 'Partner Admin',
          role: 'Admin',
          avatar: 'PA',
          permissions: rolePermissions.Admin,
          status: 'active',
        },
        scope,
      });
    }

    const tableData = await getCrmTableData(supabase, scope);
    if (tableData) {
      const actor = normalizeTeam(tableData.team).find(
        (member) =>
          (scope.userId && member.authUserId === scope.userId) ||
          (scope.userEmail && member.email.toLowerCase() === scope.userEmail.toLowerCase())
      );

      if (actor) {
        return NextResponse.json({
          success: true,
          data: {
            name: actor.name,
            role: actor.role,
            avatar: actor.avatar || initials(actor.name),
            permissions: actor.permissions?.length
              ? actor.permissions
              : rolePermissions[actor.role],
            status: actor.status,
          },
          scope,
        });
      }
    }

    const { data, error } = await supabase
      .from('b2c_report_requests')
      .select('report_json')
      .eq('mobile', scope.storeMobile)
      .eq('status', scope.storeStatus)
      .maybeSingle();
    if (error) throw error;

    const raw = isObject(data?.report_json) ? data.report_json : {};
    const actor = normalizeTeam(raw.team).find(
      (member) =>
        (scope.userId && member.authUserId === scope.userId) ||
        (scope.userEmail && member.email.toLowerCase() === scope.userEmail.toLowerCase())
    );

    if (!actor) {
      return NextResponse.json(
        { success: false, error: 'CRM user is not linked to this partner' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        name: actor.name,
        role: actor.role,
        avatar: actor.avatar || initials(actor.name),
        permissions: actor.permissions?.length ? actor.permissions : rolePermissions[actor.role],
        status: actor.status,
      },
      scope,
    });
  } catch (error: any) {
    console.error('[crm:me] GET failed:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Unable to load CRM user' },
      { status: 500 }
    );
  }
}
