import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { supabaseAdmin } from "@/lib/supabase-admin";

const createCompanySchema = z.object({
  name: z.string().min(1),
  plan: z.enum(["free", "starter", "pro", "enterprise"]).default("free"),
  status: z.enum(["active", "suspended"]).default("active"),
});

export async function GET() {
  await requireAdmin();

  const { data, error } = await supabaseAdmin
    .from("companies")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ companies: data });
}

export async function POST(request: Request) {
  const session = await requireAdmin();

  const body = await request.json();
  const parsed = createCompanySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid company data." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("companies")
    .insert(parsed.data)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  await writeAuditLog({
    actorUserId: session.userId,
    companyId: data.id,
    action: "company.created",
    targetType: "company",
    targetId: data.id,
    metadata: {
      name: data.name,
      plan: data.plan,
      status: data.status,
    },
  });

  return NextResponse.json({ company: data }, { status: 201 });
}
