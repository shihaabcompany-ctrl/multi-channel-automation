import { NextResponse } from "next/server";
import { requireCompanyUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST() {
  const session = await requireCompanyUser();

  const { data, error } = await supabaseAdmin
    .from("inbox_messages")
    .insert([
      {
        company_id: session.companyId,
        channel: "email",
        sender: "customer@example.com",
        content: "Can you share more details about tomorrow's campaign?",
      },
      {
        company_id: session.companyId,
        channel: "sms",
        sender: "+15551234567",
        content: "Thanks, I received the update.",
      },
    ])
    .select("*");

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: data }, { status: 201 });
}
