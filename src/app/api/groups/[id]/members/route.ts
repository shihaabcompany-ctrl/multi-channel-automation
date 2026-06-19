import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

const memberSchema = z.object({
  contactId: z.string().uuid(),
});

export async function POST(request: Request, { params }: Params) {
  const session = await requireCompanyUser();
  const { id: groupId } = await params;
  const body = await request.json();
  const parsed = memberSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid member data." }, { status: 400 });
  }

  const { data: group } = await supabaseAdmin
    .from("contact_groups")
    .select("id")
    .eq("id", groupId)
    .eq("company_id", session.companyId)
    .single();

  if (!group) {
    return NextResponse.json({ message: "Group not found." }, { status: 404 });
  }

  const { data: contact } = await supabaseAdmin
    .from("contacts")
    .select("id")
    .eq("id", parsed.data.contactId)
    .eq("company_id", session.companyId)
    .single();

  if (!contact) {
    return NextResponse.json({ message: "Contact not found." }, { status: 404 });
  }

  const { error } = await supabaseAdmin.from("contact_group_members").upsert({
    group_id: groupId,
    contact_id: parsed.data.contactId,
  });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}