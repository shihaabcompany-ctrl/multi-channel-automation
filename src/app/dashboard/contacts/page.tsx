import { requireCompanyUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ContactsClient } from "@/components/contacts/contacts-client";
import type { Contact } from "@/types/database";

export default async function ContactsPage() {
  const session = await requireCompanyUser();

  const { data } = await supabaseAdmin
    .from("contacts")
    .select("*")
    .eq("company_id", session.companyId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Contacts</h1>
        <p className="page-subtitle">
          Manage contacts for email, SMS, and WhatsApp campaigns.
        </p>
      </div>

      <ContactsClient contacts={(data ?? []) as Contact[]} />
    </div>
  );
}
