import { requireCompanyUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ConnectionsClient } from "@/components/connections/connections-client";
import type { PlatformConnection } from "@/types/database";

type SafePlatformConnection = Pick<
  PlatformConnection,
  | "id"
  | "platform"
  | "external_account_id"
  | "connected_account_name"
  | "expires_at"
  | "created_at"
  | "updated_at"
>;

export default async function ConnectionsPage() {
  const session = await requireCompanyUser();

  const { data: connections } = await supabaseAdmin
    .from("platform_connections")
    .select(
      "id, platform, external_account_id, connected_account_name, expires_at, created_at, updated_at"
    )
    .eq("company_id", session.companyId)
    .order("platform", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Connections</h1>
        <p className="page-subtitle">
          Connect WhatsApp, Instagram, Facebook, and LinkedIn accounts for this
          company.
        </p>
      </div>

      <ConnectionsClient
        connections={(connections ?? []) as SafePlatformConnection[]}
      />
    </div>
  );
}
