"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  Building2,
  Clock3,
  Gauge,
  Inbox,
  Landmark,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  MessageSquareText,
  RadioTower,
  Send,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { LogoutButton } from "@/components/layout/logout-button";
import { BrandLogo } from "@/components/brand/brand-logo";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
};

type AppShellProps = {
  title: string;
  navItems: NavItem[];
  account?: {
    name: string;
    email: string;
    role: string;
  };
  children: ReactNode;
};

export function AppShell({ title, navItems, account, children }: AppShellProps) {
  const pathname = usePathname();

  const navIcons = {
    AuditLogs: ListChecks,
    Automation: Clock3,
    Companies: Building2,
    Connections: RadioTower,
    Contacts: Users,
    Dashboard: LayoutDashboard,
    Groups: Users,
    Inbox: Inbox,
    ManualPosting: Megaphone,
    Overview: Gauge,
    PlatformSettings: Settings,
    Sent: Send,
    Users: ShieldCheck,
  };

  return (
    <div className="app-ambient min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo />
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5 text-xs text-muted-foreground shadow-sm md:flex">
              <span className="status-dot" />
              System online
            </div>
            {account ? (
              <div className="hidden min-w-0 max-w-[260px] items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5 text-xs shadow-sm lg:flex">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                  {account.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {account.name}
                  </span>
                  <span className="block truncate text-muted-foreground">
                    {account.email}
                  </span>
                </span>
              </div>
            ) : null}
            <LogoutButton />
          </div>
        </div>
        <div className="signal-line" />
      </header>

      <div className="grid min-h-[calc(100vh-4rem)] md:grid-cols-[260px_1fr]">
        <aside className="border-b bg-sidebar text-sidebar-foreground md:border-r md:border-b-0">
          <div className="p-4">
            <div className="mb-4 rounded-lg border border-sidebar-border bg-white/5 p-3 shadow-inner shadow-white/5">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-sidebar-foreground/60">
                <Landmark className="size-3.5" />
                Workspace
              </div>
              <div className="mt-1 text-sm font-semibold">{title}</div>
            </div>

            <nav className="grid gap-1 sm:grid-cols-2 md:block md:space-y-1">
              {navItems.map((item) => {
                const key = item.label.replace(/\s/g, "") as keyof typeof navIcons;
                const Icon = navIcons[key] ?? MessageSquareText;
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    item.href !== "/admin" &&
                    pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/75 transition-all duration-200 hover:translate-x-0.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      active &&
                        "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    )}
                  >
                    <Icon className="size-4 transition-transform group-hover:scale-110" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 p-4 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
