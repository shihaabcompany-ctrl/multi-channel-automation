import { supabaseAdmin } from "@/lib/supabase-admin";
import { CompanyCreateForm } from "@/components/companies/company-create-form";
import { CompaniesList } from "@/components/companies/companies-list";
import type { Company } from "@/types/database";

export default async function AdminCompaniesPage() {
  const { data: companies } = await supabaseAdmin
    .from("companies")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Companies</h1>
        <p className="text-muted-foreground">
          Create and manage client companies.
        </p>
      </div>

      <CompanyCreateForm />

      <CompaniesList companies={(companies ?? []) as Company[]} />
    </div>
  );
}