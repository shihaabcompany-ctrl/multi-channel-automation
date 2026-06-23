import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await requireAdmin();

    const { id } = await params;

    const { error } = await supabaseAdmin
      .from("companies")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    await writeAuditLog({
      actorUserId: session.userId,
      companyId: id,
      action: "company.deleted",
      targetType: "company",
      targetId: id,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }
}
