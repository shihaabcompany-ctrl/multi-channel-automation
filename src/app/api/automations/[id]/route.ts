import { NextResponse } from "next/server";
import { requireCompanyUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireCompanyUser();
  const { id } = await params;
  const body = await request.json();

  if (body.status !== "cancelled") {
    return NextResponse.json({ message: "Invalid status." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("automations")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("company_id", session.companyId)
    .eq("status", "queued")
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ automation: data });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await requireCompanyUser();
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("automations")
    .delete()
    .eq("id", id)
    .eq("company_id", session.companyId)
    .in("status", ["draft", "queued", "cancelled", "completed", "failed"]);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}