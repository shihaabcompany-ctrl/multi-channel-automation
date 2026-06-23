"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" type="button" onClick={handleLogout}>
      <LogOut className="size-4" />
      <span className="hidden sm:inline">Logout</span>
    </Button>
  );
}
