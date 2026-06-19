import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
});

export async function PUT(request: Request, { params }: Params) {
  const session = await requireCompanyUser();
  const { id } = await params;
  const body = await request.json();
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid contact data." }, { status: 400 });
  }

  const email = parsed.data.email || null;
  const phone = parsed.data.phone?.trim() || null;

  if (!email && !phone) {
    return NextResponse.json(
      { message: "Contact needs an email or phone number." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("contacts")
    .update({
      name: parsed.data.name,
      email,
      phone,
    })
    .eq("id", id)
    .eq("company_id", session.companyId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ contact: data });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await requireCompanyUser();
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("contacts")
    .delete()
    .eq("id", id)
    .eq("company_id", session.companyId);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}