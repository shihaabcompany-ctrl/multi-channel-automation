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
    .from("messages_log")
    .select("channel, recipient, status, error_reason, sent_at, created_at")
    .eq("company_id", session.companyId)
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const header = ["Channel", "Recipient", "Status", "Error Reason", "Sent At", "Created At"];

  const rows = data.map((message) => [
    escapeCsvValue(message.channel),
    escapeCsvValue(message.recipient),
    escapeCsvValue(message.status),
    escapeCsvValue(message.error_reason),
    escapeCsvValue(message.sent_at),
    escapeCsvValue(message.created_at),
  ]);

  const csv = [header.join(","), ...rows.map((row) => row.join(","))].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="messages-log.csv"',
    },
  });
}