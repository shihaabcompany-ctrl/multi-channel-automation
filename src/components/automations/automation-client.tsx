"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { Automation, ContactGroup } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AutomationWithGroup = Automation & {
  contact_groups?: {
    name: string;
  } | null;
};

type AutomationClientProps = {
  groups: ContactGroup[];
  automations: AutomationWithGroup[];
};

export function AutomationClient({ groups, automations }: AutomationClientProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function createAutomation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const targetChannels = ["email", "sms"].filter((channel) =>
      formData.getAll("targetChannels").includes(channel)
    );

    const scheduledAtInput = String(formData.get("scheduledAt"));
    const scheduledAt = new Date(scheduledAtInput).toISOString();

    setError("");
    setLoading(true);

    const response = await fetch("/api/automations", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: formData.get("title"),
        messageText: formData.get("messageText"),
        targetChannels,
        contactGroupId: formData.get("contactGroupId") || null,
        scheduledAt,
      }),
    });

    if (!response.ok) {
      let message = "Could not create automation.";

      try {
        const data = await response.json();
        message = data.message ?? message;
      } catch {
        message = `Could not create automation. Server returned ${response.status}.`;
      }

      setError(message);
      setLoading(false);
      return;
    }

    form.reset();
    setLoading(false);
    router.refresh();
  }

  async function cancelAutomation(id: string) {
    await fetch(`/api/automations/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "cancelled" }),
    });

    router.refresh();
  }

  async function deleteAutomation(id: string) {
    await fetch(`/api/automations/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={createAutomation}
        className="grid gap-4 rounded-lg border p-4"
      >
        <Input name="title" placeholder="Automation title" required />

        <textarea
          name="messageText"
          placeholder="Write your email/SMS message..."
          className="min-h-32 rounded-md border bg-background px-3 py-2 text-sm"
          required
        />

        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <input type="checkbox" name="targetChannels" value="email" />
            Email
          </label>

          <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <input type="checkbox" name="targetChannels" value="sms" />
            SMS
          </label>

          <select
            name="contactGroupId"
            className="h-10 rounded-md border bg-background px-3 text-sm"
            defaultValue=""
          >
            <option value="">No group selected</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        <Input name="scheduledAt" type="datetime-local" required />

        <Button type="submit" disabled={loading}>
          {loading ? "Scheduling..." : "Schedule Automation"}
        </Button>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>

      <div className="rounded-lg border">
        <div className="grid grid-cols-6 border-b px-4 py-3 text-sm font-medium">
          <div>Title</div>
          <div>Channels</div>
          <div>Group</div>
          <div>Scheduled</div>
          <div>Status</div>
          <div className="text-right">Actions</div>
        </div>

        {automations.map((automation) => (
          <div
            key={automation.id}
            className="grid grid-cols-6 items-center border-b px-4 py-3 text-sm last:border-b-0"
          >
            <div>{automation.title}</div>
            <div>{automation.target_channels.join(", ")}</div>
            <div>{automation.contact_groups?.name ?? "-"}</div>
            <div>
              {automation.scheduled_at
                ? new Date(automation.scheduled_at).toISOString().slice(0, 16)
                : "-"}
            </div>
            <div>{automation.status}</div>
            <div className="flex justify-end gap-2">
              {automation.status === "queued" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => cancelAutomation(automation.id)}
                >
                  Cancel
                </Button>
              ) : null}

              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteAutomation(automation.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}

        {!automations.length ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">
            No automations scheduled yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}