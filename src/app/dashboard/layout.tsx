import { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";

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

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell title="Company Dashboard" navItems={dashboardNavItems}>
      {children}
    </AppShell>
  );
}