import { supabaseAdmin } from "@/lib/supabase-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminPage() {
  const [{ count: totalCompanies }, { count: activeCompanies }, { count: suspendedCompanies }, { count: totalUsers }] =
    await Promise.all([
      supabaseAdmin.from("companies").select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("companies")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
      supabaseAdmin
        .from("companies")
        .select("*", { count: "exact", head: true })
        .eq("status", "suspended"),
      supabaseAdmin.from("users").select("*", { count: "exact", head: true }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Admin Overview
        </h1>
        <p className="text-muted-foreground">
          Manage companies, users, credentials, and system activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Companies</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {totalCompanies ?? 0}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Companies</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {activeCompanies ?? 0}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suspended Companies</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {suspendedCompanies ?? 0}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {totalUsers ?? 0}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}