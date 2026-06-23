import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

const updateInboxSchema = z.object({
  status: z.enum(["unread", "read", "archived"]),
});

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireCompanyUser();
  const { id } = await params;
  const body = await request.json();
  const parsed = updateInboxSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid inbox message status." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("inbox_messages")
    .update({ status: parsed.data.status })
    .eq("id", id)
    .eq("company_id", session.companyId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: data });
}
