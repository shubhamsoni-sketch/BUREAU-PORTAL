import { createAdminClient } from '@/lib/supabase/admin';

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

export async function logLenderIntelligenceAudit(
  supabase: SupabaseAdmin,
  actor: { id: string | null; email?: string | null },
  input: {
    partnerId?: string | null;
    module:
      | 'onboarding'
      | 'policy'
      | 'routing'
      | 'outcomes'
      | 'commercials'
      | 'partner_commissions'
      | 'invoicing'
      | 'compliance';
    action: string;
    entityType: string;
    entityId?: string | null;
    summary: string;
    metadata?: Record<string, unknown>;
  }
) {
  const { error } = await supabase.rpc('register_lender_intelligence_audit', {
    p_partner_id: input.partnerId || null,
    p_actor_user_id: actor.id,
    p_module: input.module,
    p_action: input.action,
    p_entity_type: input.entityType,
    p_entity_id: input.entityId || null,
    p_summary: input.summary,
    p_metadata: input.metadata || {},
  });
  if (error) throw error;
}
