import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const createUserSchema = z.object({
  companyId: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function GET() {
  try {
    await requireAdmin();

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, company_id, email, role, created_at, companies(name)")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: data });
  } catch {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid user data." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const { data, error } = await supabaseAdmin
      .from("users")
      .insert({
        company_id: parsed.data.companyId,
        email: parsed.data.email.toLowerCase(),
        password_hash: passwordHash,
        role: "company_owner",
      })
      .select("id, company_id, email, role, created_at")
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ user: data }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }
}