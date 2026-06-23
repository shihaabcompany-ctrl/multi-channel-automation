import { AuditLogsClient } from "@/components/audit-logs/audit-logs-client";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { AuditLog } from "@/types/database";

type AuditLogRow = AuditLog & {
  users?: {
    email: string;
  } | null;
  companies?: {
    name: string;
  } | null;
};

export default function AdminAuditLogsPage() {
  return <AdminAuditLogs />;
}

async function AdminAuditLogs() {
  await requireAdmin();

  const { data: logs } = await supabaseAdmin
    .from("audit_logs")
    .select("*, users(email), companies(name)")
    .order("created_at", { ascending: false })
    .limit(250);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Audit Logs</h1>
        <p className="page-subtitle">
          Review admin and system activity across the platform.
        </p>
      </div>

      <AuditLogsClient logs={(logs ?? []) as AuditLogRow[]} />
    </div>
  );
}
