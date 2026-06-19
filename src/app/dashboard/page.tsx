import { requireCompanyUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { DashboardStatsClient } from "@/components/dashboard/dashboard-stats-client";
import type { MessageLog } from "@/types/database";

export default async function DashboardPage() {
  const session = await requireCompanyUser();

  const [
    { count: contactsCount },
    { count: groupsCount },
    { count: automationsCount },
    { data: messages },
  ] = await Promise.all([
    supabaseAdmin
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("company_id", session.companyId),
    supabaseAdmin
      .from("contact_groups")
      .select("*", { count: "exact", head: true })
      .eq("company_id", session.companyId),
    supabaseAdmin
      .from("automations")
      .select("*", { count: "exact", head: true })
      .eq("company_id", session.companyId),
    supabaseAdmin
      .from("messages_log")
      .select("*")
      .eq("company_id", session.companyId)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Track your contacts, groups, automations, and delivery activity.
        </p>
      </div>

      <DashboardStatsClient
        contactsCount={contactsCount ?? 0}
        groupsCount={groupsCount ?? 0}
        automationsCount={automationsCount ?? 0}
        messages={(messages ?? []) as MessageLog[]}
      />
    </div>
  );
}