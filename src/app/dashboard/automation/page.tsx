import { requireCompanyUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { AutomationClient } from "@/components/automations/automation-client";
import type { Automation, ContactGroup } from "@/types/database";

type AutomationWithGroup = Automation & {
  contact_groups?: {
    name: string;
  } | null;
};

export default async function AutomationPage() {
  const session = await requireCompanyUser();

  const [{ data: groups }, { data: automations }] = await Promise.all([
    supabaseAdmin
      .from("contact_groups")
      .select("*")
      .eq("company_id", session.companyId)
      .order("name", { ascending: true }),
    supabaseAdmin
      .from("automations")
      .select("*, contact_groups(name)")
      .eq("company_id", session.companyId)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Automation</h1>
        <p className="text-muted-foreground">
          Schedule Email and SMS campaigns for a contact group.
        </p>
      </div>

      <AutomationClient
        groups={(groups ?? []) as ContactGroup[]}
        automations={(automations ?? []) as AutomationWithGroup[]}
      />
    </div>
  );
}