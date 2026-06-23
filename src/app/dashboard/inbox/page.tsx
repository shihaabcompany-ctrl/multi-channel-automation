import { InboxClient } from "@/components/inbox/inbox-client";
import { requireCompanyUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { InboxMessage } from "@/types/database";

export default function InboxPage() {
  return <Inbox />;
}

async function Inbox() {
  const session = await requireCompanyUser();

  const { data: messages } = await supabaseAdmin
    .from("inbox_messages")
    .select("*")
    .eq("company_id", session.companyId)
    .order("received_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Inbox</h1>
        <p className="page-subtitle">
          Review incoming replies and direct messages as they arrive.
        </p>
      </div>

      <InboxClient messages={(messages ?? []) as InboxMessage[]} />
    </div>
  );
}
