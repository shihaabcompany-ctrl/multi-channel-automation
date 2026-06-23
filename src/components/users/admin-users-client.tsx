"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { Company } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AdminUserRow = {
  id: string;
  company_id: string | null;
  email: string;
  role: string;
  created_at: string;
  companies?: {
    name: string;
  } | null;
};

type AdminUsersClientProps = {
  companies: Company[];
  users: AdminUserRow[];
};

export function AdminUsersClient({ companies, users }: AdminUsersClientProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function deleteUser(id: string) {
    await fetch(`/api/admin/users/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    router.refresh();
  }
  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setError("");
    setLoading(true);

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        companyId: formData.get("companyId"),
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });

    if (!response.ok) {
      let message = "Could not create user.";

      try {
        const data = await response.json();
        message = data.message ?? message;
      } catch {
        message = `Could not create user. Server returned ${response.status}.`;
      }

      setError(message);
      setLoading(false);
      return;
    }
    form.reset();
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={createUser}
        className="app-panel grid gap-3 p-4 md:grid-cols-[1fr_1fr_1fr_auto]"
      >
        <select
          name="companyId"
          className="h-10 rounded-md border bg-background px-3 text-sm"
          required
          defaultValue=""
        >
          <option value="" disabled>
            Select company
          </option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>

        <Input name="email" type="email" placeholder="Email" required />
        <Input name="password" type="password" placeholder="Password" required />

        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create User"}
        </Button>

        {error ? (
          <p className="text-sm text-destructive md:col-span-4">{error}</p>
        ) : null}
      </form>

      <div className="app-panel overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-5 border-b bg-muted/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
              <div>Email</div>
              <div>Role</div>
              <div>Company</div>
              <div>Created</div>
              <div className="text-right">Actions</div>
            </div>

            {users.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-5 items-center border-b px-4 py-3 text-sm last:border-b-0"
              >
                <div className="font-medium">{user.email}</div>
                <div className="text-muted-foreground">{user.role}</div>
                <div className="text-muted-foreground">
                  {user.companies?.name ?? "Admin"}
                </div>
                <div className="text-muted-foreground">
                  {new Date(user.created_at).toISOString().slice(0, 10)}
                </div>
                <div className="text-right">
                  {user.role !== "super_admin" ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteUser(user.id)}
                    >
                      Delete
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}

            {!users.length ? (
              <div className="px-4 py-8 text-sm text-muted-foreground">
                No users yet.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
