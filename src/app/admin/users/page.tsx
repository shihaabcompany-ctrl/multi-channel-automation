import { supabaseAdmin } from "@/lib/supabase-admin";
import { AdminUsersClient } from "@/components/users/admin-users-client";
import type { Company } from "@/types/database";

export default async function AdminUsersPage() {
  const [{ data: companies }, { data: users }] = await Promise.all([
    supabaseAdmin
      .from("companies")
      .select("*")
      .order("name", { ascending: true }),
    supabaseAdmin
      .from("users")
      .select("id, company_id, email, role, created_at, companies(name)")
      .order("created_at", { ascending: false }),
  ]);

  const userRows = (users ?? []).map((user: any) => ({
    ...user,
    companies: Array.isArray(user?.companies) ? user.companies[0] : user?.companies,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          Create company owners and staff accounts.
        </p>
      </div>

      <AdminUsersClient
        companies={(companies ?? []) as Company[]}
        users={userRows}
      />
    </div>
  );
}