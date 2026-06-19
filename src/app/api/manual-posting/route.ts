import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendMessage } from "@/lib/send-message";

const manualPostingSchema = z.object({
  title: z.string().min(1),
  messageText: z.string().min(1),
  targetChannels: z.array(z.enum(["email", "sms"])).min(1),
  contactGroupId: z.string().uuid(),
});

export async function POST(request: Request) {
  const session = await requireCompanyUser();
  const body = await request.json();
  const parsed = manualPostingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid manual posting data." },
      { status: 400 }
    );
  }

  const { data: group } = await supabaseAdmin
    .from("contact_groups")
    .select("id")
    .eq("id", parsed.data.contactGroupId)
    .eq("company_id", session.companyId)
    .single();

  if (!group) {
    return NextResponse.json({ message: "Group not found." }, { status: 404 });
  }

  const { data: members, error: membersError } = await supabaseAdmin
    .from("contact_group_members")
    .select("contacts(id, name, email, phone)")
    .eq("group_id", parsed.data.contactGroupId);

  if (membersError) {
    return NextResponse.json({ message: membersError.message }, { status: 500 });
  }

  const contacts = (members ?? [])
  .flatMap((member) => member.contacts ?? [])
  .filter(Boolean);

  let sent = 0;
  let failed = 0;

  for (const channel of parsed.data.targetChannels) {
    for (const contact of contacts) {
      const recipient = channel === "email" ? contact.email : contact.phone;

      const result = await sendMessage({
        channel,
        title: parsed.data.title,
        text: parsed.data.messageText,
        recipient,
      });

      if (result.status === "sent") {
        sent += 1;
      } else {
        failed += 1;
      }

      await supabaseAdmin.from("messages_log").insert({
        automation_id: null,
        company_id: session.companyId,
        channel,
        recipient,
        status: result.status,
        error_reason: result.error,
        sent_at: result.status === "sent" ? new Date().toISOString() : null,
      });
    }
  }

  return NextResponse.json({ ok: true, sent, failed });
}