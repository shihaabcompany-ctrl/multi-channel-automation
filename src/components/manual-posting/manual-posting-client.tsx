"use client";

import { FormEvent, useState } from "react";
import type { ContactGroup } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ManualPostingClientProps = {
  groups: ContactGroup[];
};

export function ManualPostingClient({ groups }: ManualPostingClientProps) {
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendNow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const targetChannels = ["email", "sms"].filter((channel) =>
      formData.getAll("targetChannels").includes(channel)
    );

    setError("");
    setResult("");
    setLoading(true);

    const response = await fetch("/api/manual-posting", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: formData.get("title"),
        messageText: formData.get("messageText"),
        targetChannels,
        contactGroupId: formData.get("contactGroupId"),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message ?? "Could not send manual post.");
      setLoading(false);
      return;
    }

    form.reset();
    setResult(`Sent: ${data.sent}. Failed: ${data.failed}.`);
    setLoading(false);
  }

  return (
    <form onSubmit={sendNow} className="grid gap-4 rounded-lg border p-4">
      <Input name="title" placeholder="Message title" required />

      <textarea
        name="messageText"
        placeholder="Write your message..."
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
          required
          defaultValue=""
        >
          <option value="" disabled>
            Select group
          </option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Sending..." : "Post Now"}
      </Button>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {result ? <p className="text-sm text-muted-foreground">{result}</p> : null}
    </form>
  );
}