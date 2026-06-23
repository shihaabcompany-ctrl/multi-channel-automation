import { NextResponse } from "next/server";
import { requireCompanyUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireCompanyUser();
  const { id } = await context.params;

  const { error } = await supabaseAdmin
    .from("platform_connections")
    .delete()
    .eq("id", id)
    .eq("company_id", session.companyId);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
