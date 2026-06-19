import { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";

const adminNavItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/companies", label: "Companies" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/audit-logs", label: "Audit Logs" },
  { href: "/admin/settings", label: "Platform Settings" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell title="Admin Panel" navItems={adminNavItems}>
      {children}
    </AppShell>
  );
}