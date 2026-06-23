import { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { requireCompanyUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const dashboardNavItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/inbox", label: "Inbox" },
  { href: "/dashboard/sent", label: "Sent" },
  { href: "/dashboard/contacts", label: "Contacts" },
  { href: "/dashboard/groups", label: "Groups" },
  { href: "/dashboard/automation", label: "Automation" },
  { href: "/dashboard/manual-posting", label: "Manual Posting" },
  { href: "/dashboard/settings/connections", label: "Connections" },
];

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireCompanyUser();
  const { data: company } = await supabaseAdmin
    .from("companies")
    .select("name")
    .eq("id", session.companyId)
    .single();

  return (
    <AppShell
      title="Company Dashboard"
      navItems={dashboardNavItems}
      account={{
        name: company?.name ?? "Company Workspace",
        email: session.email,
        role: session.role,
      }}
    >
      {children}
    </AppShell>
  );
}
