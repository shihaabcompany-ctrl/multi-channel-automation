import { requireCompanyUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ManualPostingClient } from "@/components/manual-posting/manual-posting-client";
import type { ContactGroup } from "@/types/database";

export default async function ManualPostingPage() {
  const session = await requireCompanyUser();

  const { data: groups } = await supabaseAdmin
    .from("contact_groups")
    .select("*")
    .eq("company_id", session.companyId)
    .order("name", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Manual Posting</h1>
        <p className="page-subtitle">
          Send multi-channel messages immediately with optional image and video media.
        </p>
      </div>

      <ManualPostingClient groups={(groups ?? []) as ContactGroup[]} />
    </div>
  );
}
