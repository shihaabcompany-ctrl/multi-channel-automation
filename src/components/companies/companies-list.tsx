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
        <Card key={company.id}>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <CardTitle>{company.name}</CardTitle>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteCompany(company.id)}
            >
              Delete
            </Button>
          </CardHeader>

          <CardContent className="flex gap-4 text-sm text-muted-foreground">
            <span>Plan: {company.plan}</span>
            <span>Status: {company.status}</span>
          </CardContent>
        </Card>
      ))}

      {!companies.length ? (
        <p className="text-sm text-muted-foreground">
          No companies created yet.
        </p>
      ) : null}
    </div>
  );
}