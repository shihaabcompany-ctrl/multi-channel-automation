import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const automationSchema = z.object({
  title: z.string().min(1),
  messageText: z.string().min(1),
  targetChannels: z.array(z.enum(["email", "sms"])).min(1),
  contactGroupId: z.string().uuid().nullable(),
  scheduledAt: z.string().datetime(),
});

export async function GET() {
  const session = await requireCompanyUser();

  const { data, error } = await supabaseAdmin
    .from("automations")
    .select("*, contact_groups(name)")
    .eq("company_id", session.companyId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ automations: data });
}

export async function POST(request: Request) {
  const session = await requireCompanyUser();
  const body = await request.json();
  const parsed = automationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid automation data." },
      { status: 400 }
    );
  }

  if (parsed.data.contactGroupId) {
    const { data: group } = await supabaseAdmin
      .from("contact_groups")
      .select("id")
      .eq("id", parsed.data.contactGroupId)
      .eq("company_id", session.companyId)
      .single();

    if (!group) {
      return NextResponse.json({ message: "Group not found." }, { status: 404 });
    }
  }

  const { data, error } = await supabaseAdmin
    .from("automations")
    .insert({
      company_id: session.companyId,
      title: parsed.data.title,
      message_text: parsed.data.messageText,
      target_channels: parsed.data.targetChannels,
      contact_group_id: parsed.data.contactGroupId,
      scheduled_at: parsed.data.scheduledAt,
      status: "queued",
      created_by: session.userId,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ automation: data }, { status: 201 });
}