import { NextResponse } from "next/server";
import { requireCompanyUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Params = {
  params: Promise<{
    id: string;
    contactId: string;
  }>;
};

export async function DELETE(_request: Request, { params }: Params) {
  const session = await requireCompanyUser();
  const { id: groupId, contactId } = await params;

  const { data: group } = await supabaseAdmin
    .from("contact_groups")
    .select("id")
    .eq("id", groupId)
    .eq("company_id", session.companyId)
    .single();

  if (!group) {
    return NextResponse.json({ message: "Group not found." }, { status: 404 });
  }

  const { error } = await supabaseAdmin
    .from("contact_group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("contact_id", contactId);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}