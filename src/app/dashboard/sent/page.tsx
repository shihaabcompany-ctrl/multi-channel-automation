import { requireCompanyUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { SentClient } from "@/components/sent/sent-client";
import type { MessageLog } from "@/types/database";

export default async function SentPage() {
  const session = await requireCompanyUser();

  const { data } = await supabaseAdmin
    .from("messages_log")
    .select("*")
    .eq("company_id", session.companyId)
    .order("created_at", { ascending: false });

  const messages = (data ?? []) as MessageLog[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Sent</h1>
        <p className="page-subtitle">
          View sent, pending, and failed delivery records.
        </p>
      </div>

      <SentClient messages={messages} />
    </div>
  );
}
