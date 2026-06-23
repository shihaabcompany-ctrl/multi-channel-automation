import { AdminSettingsClient } from "@/components/admin-settings/admin-settings-client";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export default function AdminSettingsPage() {
  return <AdminSettings />;
}

async function AdminSettings() {
  await requireAdmin();

  const { data } = await supabaseAdmin
    .from("platform_settings")
    .select("*")
    .eq("key", "operations")
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Platform Settings</h1>
        <p className="page-subtitle">
          Configure platform-level credentials and defaults.
        </p>
      </div>

      <AdminSettingsClient settings={data?.value ?? null} />
    </div>
  );
}
