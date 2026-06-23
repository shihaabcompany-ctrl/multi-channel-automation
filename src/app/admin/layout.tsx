import { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { requireAdmin } from "@/lib/auth";

const adminNavItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/companies", label: "Companies" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/audit-logs", label: "Audit Logs" },
  { href: "/admin/settings", label: "Platform Settings" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();

  return (
    <AppShell
      title="Admin Panel"
      navItems={adminNavItems}
      account={{
        name: "Zyrelo Admin",
        email: session.email,
        role: session.role,
      }}
    >
      {children}
    </AppShell>
  );
}
