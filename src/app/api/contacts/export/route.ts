import { requireCompanyUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

function escapeCsvValue(value: string | null) {
  if (!value) return "";

  const escaped = value.replaceAll('"', '""');
  return `"${escaped}"`;
}

export async function GET() {
  const session = await requireCompanyUser();

  const { data, error } = await supabaseAdmin
    .from("contacts")
    .select("name, email, phone, created_at")
    .eq("company_id", session.companyId)
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const header = ["Name", "Email", "Phone", "Created At"];
  const rows = data.map((contact) => [
    escapeCsvValue(contact.name),
    escapeCsvValue(contact.email),
    escapeCsvValue(contact.phone),
    escapeCsvValue(contact.created_at),
  ]);

  const csv = [header.join(","), ...rows.map((row) => row.join(","))].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="contacts.csv"',
    },
  });
}