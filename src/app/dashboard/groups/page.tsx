import { requireCompanyUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { GroupsClient } from "@/components/groups/groups-client";
import type { Contact, ContactGroup } from "@/types/database";

type GroupMemberRow = {
  group_id: string;
  contact_id: string;
};

export default async function GroupsPage() {
  const session = await requireCompanyUser();

  const [{ data: groups }, { data: contacts }, { data: members }] =
    await Promise.all([
      supabaseAdmin
        .from("contact_groups")
        .select("*")
        .eq("company_id", session.companyId)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("contacts")
        .select("*")
        .eq("company_id", session.companyId)
        .order("name", { ascending: true }),
      supabaseAdmin
        .from("contact_group_members")
        .select("group_id, contact_id"),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Groups</h1>
        <p className="text-muted-foreground">
          Create groups and assign contacts to campaign audiences.
        </p>
      </div>

      <GroupsClient
        groups={(groups ?? []) as ContactGroup[]}
        contacts={(contacts ?? []) as Contact[]}
        members={(members ?? []) as GroupMemberRow[]}
      />
    </div>
  );
}