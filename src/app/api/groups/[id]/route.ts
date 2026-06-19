import { NextResponse } from "next/server";
import { requireCompanyUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, { params }: Params) {
  const session = await requireCompanyUser();
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("contact_groups")
    .delete()
    .eq("id", id)
    .eq("company_id", session.companyId);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}