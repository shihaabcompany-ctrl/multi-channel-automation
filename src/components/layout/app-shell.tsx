import Link from "next/link";
import { ReactNode } from "react";
import { LogoutButton } from "@/components/layout/logout-button";

type NavItem = {
  href: string;
  label: string;
};

type AppShellProps = {
  title: string;
  navItems: NavItem[];
  children: ReactNode;
};

export function AppShell({ title, navItems, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="flex h-16 items-center justify-between px-6">
          <Link href="/" className="font-semibold">
            Multi-Channel SaaS
          </Link>

          <LogoutButton />
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-4rem)] md:grid-cols-[240px_1fr]">
        <aside className="border-r p-4">
          <div className="mb-4 text-sm font-medium text-muted-foreground">
            {title}
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}