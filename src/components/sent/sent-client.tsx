"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MessageLog } from "@/types/database";

type FilterValue = "all" | string;

export function SentClient({ messages }: { messages: MessageLog[] }) {
  const [channel, setChannel] = useState<FilterValue>("all");
  const [status, setStatus] = useState<FilterValue>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredMessages = useMemo(() => {
    return messages.filter((message) => {
      const channelMatches = channel === "all" || message.channel === channel;
      const statusMatches = status === "all" || message.status === status;

      const createdAt = new Date(message.created_at).getTime();
      const fromMatches = fromDate
        ? createdAt >= new Date(`${fromDate}T00:00:00`).getTime()
        : true;
      const toMatches = toDate
        ? createdAt <= new Date(`${toDate}T23:59:59`).getTime()
        : true;

      return channelMatches && statusMatches && fromMatches && toMatches;
    });
  }, [channel, fromDate, messages, status, toDate]);

  function clearFilters() {
    setChannel("all");
    setStatus("all");
    setFromDate("");
    setToDate("");
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto_auto]">
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
          <option value="sent">Sent</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>

        <Input
          type="date"
          value={fromDate}
          onChange={(event) => setFromDate(event.target.value)}
        />

        <Input
          type="date"
          value={toDate}
          onChange={(event) => setToDate(event.target.value)}
        />

        <Button type="button" variant="outline" onClick={clearFilters}>
          Clear
        </Button>

        <Button asChild variant="outline">
          <a href="/api/messages-log/export">Export CSV</a>
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredMessages.length} of {messages.length} messages.
      </div>

      <div className="rounded-lg border">
        <div className="grid grid-cols-6 border-b px-4 py-3 text-sm font-medium">
          <div>Channel</div>
          <div>Recipient</div>
          <div>Status</div>
          <div>Error</div>
          <div>Sent At</div>
          <div>Created</div>
        </div>

        {filteredMessages.map((message) => (
          <div
            key={message.id}
            className="grid grid-cols-6 border-b px-4 py-3 text-sm last:border-b-0"
          >
            <div>{message.channel}</div>
            <div>{message.recipient ?? "-"}</div>
            <div>{message.status}</div>
            <div>{message.error_reason ?? "-"}</div>
            <div>
              {message.sent_at
                ? new Date(message.sent_at).toISOString().slice(0, 16)
                : "-"}
            </div>
            <div>{new Date(message.created_at).toISOString().slice(0, 10)}</div>
          </div>
        ))}

        {!filteredMessages.length ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">
            No messages found.
          </div>
        ) : null}
      </div>
    </div>
  );
}