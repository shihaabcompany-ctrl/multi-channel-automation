import { NextResponse } from "next/server";
import { requireCompanyUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

function escapeCsv(value: string | null) {
  const safeValue = value ?? "";
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export async function GET() {
  const session = await requireCompanyUser();

  const { data, error } = await supabaseAdmin
    .from("inbox_messages")
    .select("*")
    .eq("company_id", session.companyId)
    .order("received_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const csv = [
    ["channel", "sender", "content", "status", "received_at"].join(","),
    ...rows.map((message) =>
      [
        escapeCsv(message.channel),
        escapeCsv(message.sender),
        escapeCsv(message.content),
        escapeCsv(message.status),
        escapeCsv(message.received_at),
      ].join(",")
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=inbox-messages.csv",
    },
  });
}
