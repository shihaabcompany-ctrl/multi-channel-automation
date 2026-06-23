import { decryptSecret } from "@/lib/encryption";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { PlatformConnectionPlatform } from "@/types/database";

export type DecryptedPlatformConnection = {
  id: string;
  platform: PlatformConnectionPlatform;
  externalAccountId: string;
  connectedAccountName: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
};

export async function getPlatformConnectionForCompany(
  companyId: string,
  platform: PlatformConnectionPlatform
): Promise<DecryptedPlatformConnection | null> {
  const { data, error } = await supabaseAdmin
    .from("platform_connections")
    .select(
      "id, platform, external_account_id, connected_account_name, encrypted_access_token, encrypted_refresh_token, expires_at"
    )
    .eq("company_id", companyId)
    .eq("platform", platform)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    platform: data.platform,
    externalAccountId: data.external_account_id,
    connectedAccountName: data.connected_account_name,
    accessToken: decryptSecret(data.encrypted_access_token),
    refreshToken: data.encrypted_refresh_token
      ? decryptSecret(data.encrypted_refresh_token)
      : null,
    expiresAt: data.expires_at,
  };
}
