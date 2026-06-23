"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { InboxMessage } from "@/types/database";

type FilterValue = "all" | string;

export function InboxClient({ messages }: { messages: InboxMessage[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState<FilterValue>("all");
  const [status, setStatus] = useState<FilterValue>("all");

  const filteredMessages = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return messages.filter((message) => {
      const queryMatches = normalized
        ? message.sender.toLowerCase().includes(normalized) ||
          message.content.toLowerCase().includes(normalized)
        : true;
      const channelMatches = channel === "all" || message.channel === channel;
      const statusMatches = status === "all" || message.status === status;

      return queryMatches && channelMatches && statusMatches;
    });
  }, [channel, messages, query, status]);

  async function updateMessageStatus(id: string, nextStatus: string) {
    await fetch(`/api/inbox/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: nextStatus }),
    });

    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="app-panel grid gap-3 p-4 md:grid-cols-[1fr_180px_180px]">
        <Input
          placeholder="Search sender or message..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <select
          value={channel}
          onChange={(event) => setChannel(event.target.value)}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">All channels</option>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
          <option value="linkedin">LinkedIn</option>
        </select>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          Showing {filteredMessages.length} of {messages.length} messages.
        </span>
        <Button asChild variant="outline" size="sm">
          {/* API download endpoint needs a regular anchor. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/inbox/export">Export CSV</a>
        </Button>
      </div>

      <div className="grid gap-3">
        {filteredMessages.map((message) => (
          <div key={message.id} className="app-panel p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {message.channel}
                  </Badge>
                  <Badge
                    variant={message.status === "unread" ? "default" : "outline"}
                    className="capitalize"
                  >
                    {message.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(message.received_at).toISOString().slice(0, 16)}
                  </span>
                </div>
                <h2 className="mt-3 font-semibold">{message.sender}</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {message.content}
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                {message.status !== "read" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateMessageStatus(message.id, "read")}
                  >
                    Mark Read
                  </Button>
                ) : null}
                {message.status !== "archived" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateMessageStatus(message.id, "archived")}
                  >
                    Archive
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ))}

        {!filteredMessages.length ? (
          <div className="app-panel px-4 py-8 text-sm text-muted-foreground">
            No inbox messages found.
          </div>
        ) : null}
      </div>
    </div>
  );
}
