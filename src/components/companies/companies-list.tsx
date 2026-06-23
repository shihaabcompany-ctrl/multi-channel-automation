"use client";

import { useRouter } from "next/navigation";
import type { Company } from "@/types/database";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function CompaniesList({ companies }: { companies: Company[] }) {
  const router = useRouter();

  async function deleteCompany(id: string) {
    await fetch(`/api/admin/companies/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    router.refresh();
  }

  return (
    <div className="grid gap-4">
      {companies.map((company) => (
        <Card key={company.id} className="overflow-hidden">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>{company.name}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Created {new Date(company.created_at).toISOString().slice(0, 10)}
              </p>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteCompany(company.id)}
            >
              Delete
            </Button>
          </CardHeader>

          <CardContent className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="rounded-md bg-muted px-2 py-1">Plan: {company.plan}</span>
            <span className="rounded-md bg-muted px-2 py-1">
              Status: {company.status}
            </span>
          </CardContent>
        </Card>
      ))}

      {!companies.length ? (
        <p className="app-panel px-4 py-8 text-sm text-muted-foreground">
          No companies created yet.
        </p>
      ) : null}
    </div>
  );
}
