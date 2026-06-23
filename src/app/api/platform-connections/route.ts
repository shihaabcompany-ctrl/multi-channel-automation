import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyUser } from "@/lib/auth";
import { encryptSecret } from "@/lib/encryption";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { PLATFORM_CHANNEL_VALUES } from "@/lib/channels";

const connectionSchema = z.object({
  platform: z.enum(PLATFORM_CHANNEL_VALUES),
  connectedAccountName: z.string().min(1),
  externalAccountId: z.string().min(1),
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export async function GET() {
  const session = await requireCompanyUser();

  const { data, error } = await supabaseAdmin
    .from("platform_connections")
    .select("id, company_id, platform, external_account_id, connected_account_name, expires_at, created_at, updated_at")
    .eq("company_id", session.companyId)
    .order("platform", { ascending: true });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ connections: data });
}

export async function POST(request: Request) {
  const session = await requireCompanyUser();
  const body = await request.json();
  const parsed = connectionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid connection data." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("platform_connections")
    .upsert(
      {
        company_id: session.companyId,
        platform: parsed.data.platform,
        connected_account_name: parsed.data.connectedAccountName,
        external_account_id: parsed.data.externalAccountId,
        encrypted_access_token: encryptSecret(parsed.data.accessToken),
        encrypted_refresh_token: parsed.data.refreshToken
          ? encryptSecret(parsed.data.refreshToken)
          : null,
        expires_at: parsed.data.expiresAt ?? null,
      },
      {
        onConflict: "company_id,platform",
      }
    )
    .select("id, company_id, platform, external_account_id, connected_account_name, expires_at, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ connection: data }, { status: 201 });
}
