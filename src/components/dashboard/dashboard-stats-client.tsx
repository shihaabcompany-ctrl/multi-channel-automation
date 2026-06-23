"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Contact,
  Layers3,
  RadioTower,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { MessageLog } from "@/types/database";

type DashboardStatsClientProps = {
  contactsCount: number;
  groupsCount: number;
  automationsCount: number;
  messages: MessageLog[];
};

export function DashboardStatsClient({
  contactsCount,
  groupsCount,
  automationsCount,
  messages,
}: DashboardStatsClientProps) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredMessages = useMemo(() => {
    return messages.filter((message) => {
      const createdAt = new Date(message.created_at).getTime();

      const fromMatches = fromDate
        ? createdAt >= new Date(`${fromDate}T00:00:00`).getTime()
        : true;

      const toMatches = toDate
        ? createdAt <= new Date(`${toDate}T23:59:59`).getTime()
        : true;

      return fromMatches && toMatches;
    });
  }, [fromDate, messages, toDate]);

  const sentCount = filteredMessages.filter(
    (message) => message.status === "sent"
  ).length;

  const pendingCount = filteredMessages.filter(
    (message) => message.status === "pending"
  ).length;

  const failedCount = filteredMessages.filter(
    (message) => message.status === "failed"
  ).length;

  const totalMessages = filteredMessages.length;
  const successRate = totalMessages
    ? Math.round((sentCount / totalMessages) * 100)
    : 0;

  const channelCounts = filteredMessages.reduce<Record<string, number>>(
    (acc, message) => {
      acc[message.channel] = (acc[message.channel] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const statCards = [
    {
      title: "Contacts",
      value: contactsCount,
      helper: "Audience records",
      icon: Contact,
    },
    {
      title: "Groups",
      value: groupsCount,
      helper: "Saved segments",
      icon: Layers3,
    },
    {
      title: "Automations",
      value: automationsCount,
      helper: "Scheduled campaigns",
      icon: Clock3,
    },
    {
      title: "Sent",
      value: sentCount,
      helper: `${successRate}% success rate`,
      icon: CheckCircle2,
    },
    {
      title: "Pending",
      value: pendingCount,
      helper: "Awaiting delivery",
      icon: RadioTower,
    },
    {
      title: "Failed",
      value: failedCount,
      helper: "Needs attention",
      icon: AlertCircle,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="app-panel overflow-hidden p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_320px] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs text-muted-foreground">
              <span className="status-dot" />
              Operations overview
            </div>
            <h2 className="text-xl font-semibold tracking-tight">
              Monitor audience, automation, and delivery health from one place.
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Your filtered window is powering the live stats, channel mix, and
              recent activity below.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-lg border bg-background/70 p-3 text-center">
            <div>
              <div className="text-2xl font-semibold">{totalMessages}</div>
              <div className="text-xs text-muted-foreground">Attempts</div>
            </div>
            <div>
              <div className="text-2xl font-semibold">{successRate}%</div>
              <div className="text-xs text-muted-foreground">Success</div>
            </div>
            <div>
              <div className="text-2xl font-semibold">{failedCount}</div>
              <div className="text-xs text-muted-foreground">Issues</div>
            </div>
          </div>
        </div>
      </div>

      <div className="app-panel flex flex-col gap-3 p-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-sm font-semibold">Reporting Window</h2>
          <p className="text-sm text-muted-foreground">
            Filter delivery activity by created date.
          </p>
        </div>

        <div className="grid gap-3 md:w-[420px] md:grid-cols-2">
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
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((stat) => (
          <Card
            key={stat.title}
            className="overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/10"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <span className="flex size-9 items-center justify-center rounded-md bg-accent text-accent-foreground ring-1 ring-primary/15">
                <stat.icon className="size-4" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight">
                {stat.value}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {stat.helper}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="app-panel p-4">
          <div className="mb-4">
            <h2 className="text-sm font-semibold">Channel Mix</h2>
            <p className="text-sm text-muted-foreground">
              Delivery attempts in the current window.
            </p>
          </div>

          <div className="space-y-3">
            {Object.entries(channelCounts).map(([channel, count]) => (
              <div key={channel} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize">{channel}</span>
                  <span className="font-medium">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{
                      width: `${totalMessages ? (count / totalMessages) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}

            {!Object.keys(channelCounts).length ? (
              <p className="text-sm text-muted-foreground">
                No delivery attempts yet.
              </p>
            ) : null}
          </div>
        </div>

        <div className="app-panel overflow-hidden">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Recent Activity</h2>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[680px]">
              <div className="grid grid-cols-[1fr_1fr_120px_160px] border-b bg-muted/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                <div>Channel</div>
                <div>Recipient</div>
                <div>Status</div>
                <div>Created</div>
              </div>

              {filteredMessages.slice(0, 8).map((message) => (
                <div
                  key={message.id}
                  className="grid grid-cols-[1fr_1fr_120px_160px] items-center border-b px-4 py-3 text-sm transition-colors last:border-b-0 hover:bg-accent/30"
                >
                  <div className="capitalize">{message.channel}</div>
                  <div className="truncate text-muted-foreground">
                    {message.recipient ?? "-"}
                  </div>
                  <div>
                    <Badge
                      variant={
                        message.status === "failed"
                          ? "destructive"
                          : message.status === "sent"
                            ? "default"
                            : "outline"
                      }
                    >
                      {message.status}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground">
                    {new Date(message.created_at).toISOString().slice(0, 10)}
                  </div>
                </div>
              ))}

              {!filteredMessages.length ? (
                <div className="px-4 py-8 text-sm text-muted-foreground">
                  No messages found for this window.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
