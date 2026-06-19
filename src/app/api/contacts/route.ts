import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
});

export async function GET() {
  const session = await requireCompanyUser();

  const { data, error } = await supabaseAdmin
    .from("contacts")
    .select("*")
    .eq("company_id", session.companyId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ contacts: data });
}

export async function POST(request: Request) {
  const session = await requireCompanyUser();
  const body = await request.json();
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid contact data." }, { status: 400 });
  }

  const email = parsed.data.email || null;
  const phone = parsed.data.phone || null;

  if (!email && !phone) {
    return NextResponse.json(
      { message: "Contact needs an email or phone number." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("contacts")
    .insert({
      company_id: session.companyId,
      name: parsed.data.name,
      email,
      phone,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ contact: data }, { status: 201 });
}