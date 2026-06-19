"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:max-w-md md:grid-cols-2">
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {contactsCount}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Groups</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {groupsCount}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Automations</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {automationsCount}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sent</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {sentCount}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {pendingCount}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Failed</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {failedCount}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}