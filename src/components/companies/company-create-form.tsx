"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CompanyCreateForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setError("");
    setLoading(true);

    const response = await fetch("/api/admin/companies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: formData.get("name"),
        plan: "free",
        status: "active",
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.message ?? "Could not create company.");
      setLoading(false);
      return;
    }

    form.reset();
    setLoading(false);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="app-panel flex flex-col gap-3 p-4 md:flex-row"
    >
      <Input name="name" placeholder="Company name" required />

      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Company"}
      </Button>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
