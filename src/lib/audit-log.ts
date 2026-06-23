import { supabaseAdmin } from "@/lib/supabase-admin";

type AuditLogPayload = {
  actorUserId: string | null;
  companyId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog({
  actorUserId,
  companyId = null,
  action,
  targetType,
  targetId = null,
  metadata = {},
}: AuditLogPayload) {
  const { error } = await supabaseAdmin.from("audit_logs").insert({
    actor_user_id: actorUserId,
    company_id: companyId,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata,
  });

  if (error) {
    console.error("Could not write audit log:", error.message);
  }
}
