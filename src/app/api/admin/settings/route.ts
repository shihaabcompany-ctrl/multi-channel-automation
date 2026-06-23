import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { supabaseAdmin } from "@/lib/supabase-admin";

const settingsSchema = z.object({
  emailProvider: z.enum(["resend", "gmail"]).default("resend"),
  smsProvider: z.literal("twilio").default("twilio"),
  workerIntervalSeconds: z.number().int().min(10).max(3600),
  maxRetryAttempts: z.number().int().min(0).max(10),
  maintenanceMode: z.boolean().default(false),
});

export async function GET() {
  await requireAdmin();

  const { data, error } = await supabaseAdmin
    .from("platform_settings")
    .select("*")
    .eq("key", "operations")
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data?.value ?? null });
}

export async function PUT(request: Request) {
  const session = await requireAdmin();
  const body = await request.json();
  const parsed = settingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid platform settings." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("platform_settings")
    .upsert(
      {
        key: "operations",
        value: parsed.data,
        updated_by: session.userId,
      },
      {
        onConflict: "key",
      }
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "platform_settings.updated",
    targetType: "platform_settings",
    targetId: data.key,
    metadata: parsed.data,
  });

  return NextResponse.json({ settings: data.value });
}
