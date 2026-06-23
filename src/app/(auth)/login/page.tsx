"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/brand-logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message ?? "Login failed.");
      setLoading(false);
      return;
    }

    router.push(data.redirectTo);
    router.refresh();
  }

  return (
    <main className="app-ambient grid min-h-screen lg:grid-cols-[1fr_460px]">
      <section className="hidden bg-sidebar p-10 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo tone="dark" />
        </div>

        <div className="max-w-xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-sidebar-border bg-white/5 px-3 py-2 text-sm text-sidebar-foreground/80">
            <ShieldCheck className="size-4" />
            Company-scoped access
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">
            Campaign operations in one focused workspace.
          </h1>
          <p className="mt-4 text-sm leading-6 text-sidebar-foreground/65">
            Manage contacts, groups, media, scheduled campaigns, and delivery
            logs from a clean operational dashboard.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {["Media", "Audience", "Delivery"].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-sidebar-border bg-white/5 p-3"
              >
                <div className="mb-3 h-1.5 rounded-full bg-sidebar-primary" />
                <div className="text-sm font-medium">{item}</div>
                <div className="mt-1 text-xs text-sidebar-foreground/50">
                  Synced
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-sidebar-foreground/45">
          Secure dashboard access
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md border-primary/20 bg-card/90 shadow-xl shadow-black/10 backdrop-blur">
        <CardHeader>
          <div className="mb-2 lg:hidden">
            <BrandLogo />
          </div>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>
            Access your automation dashboard.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>

            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}

            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
              <ArrowRight className="size-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
      </section>
    </main>
  );
}
