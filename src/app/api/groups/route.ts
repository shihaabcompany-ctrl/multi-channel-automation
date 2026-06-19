import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const groupSchema = z.object({
  name: z.string().min(1),
});

export async function GET() {
  const session = await requireCompanyUser();

  const { data, error } = await supabaseAdmin
    .from("contact_groups")
    .select("*")
    .eq("company_id", session.companyId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ groups: data });
}

export async function POST(request: Request) {
  const session = await requireCompanyUser();
  const body = await request.json();
  const parsed = groupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid group data." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("contact_groups")
    .insert({
      company_id: session.companyId,
      name: parsed.data.name,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ group: data }, { status: 201 });
}