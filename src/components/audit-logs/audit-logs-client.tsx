"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { AuditLog } from "@/types/database";

type AuditLogRow = AuditLog & {
  users?: {
    email: string;
  } | null;
  companies?: {
    name: string;
  } | null;
};

export function AuditLogsClient({ logs }: { logs: AuditLogRow[] }) {
  const [query, setQuery] = useState("");

  const filteredLogs = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) return logs;

    return logs.filter((log) => {
      return (
        log.action.toLowerCase().includes(normalized) ||
        log.target_type.toLowerCase().includes(normalized) ||
        log.users?.email.toLowerCase().includes(normalized) ||
        log.companies?.name.toLowerCase().includes(normalized)
      );
    });
  }, [logs, query]);

  return (
    <div className="space-y-4">
      <div className="app-panel p-4">
        <Input
          className="md:max-w-sm"
          placeholder="Search audit logs..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="app-panel overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[940px]">
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_160px] border-b bg-muted/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
              <div>Action</div>
              <div>Actor</div>
              <div>Company</div>
              <div>Target</div>
              <div>Created</div>
            </div>

            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="grid grid-cols-[1fr_1fr_1fr_1fr_160px] items-center border-b px-4 py-3 text-sm transition-colors last:border-b-0 hover:bg-accent/30"
              >
                <div>
                  <Badge variant="outline">{log.action}</Badge>
                </div>
                <div className="truncate text-muted-foreground">
                  {log.users?.email ?? "System"}
                </div>
                <div className="truncate text-muted-foreground">
                  {log.companies?.name ?? "-"}
                </div>
                <div className="truncate">
                  {log.target_type}
                  {log.target_id ? (
                    <span className="text-muted-foreground">
                      {" "}
                      / {log.target_id.slice(0, 8)}
                    </span>
                  ) : null}
                </div>
                <div className="text-muted-foreground">
                  {new Date(log.created_at).toISOString().slice(0, 16)}
                </div>
              </div>
            ))}

            {!filteredLogs.length ? (
              <div className="px-4 py-8 text-sm text-muted-foreground">
                No audit events found.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
