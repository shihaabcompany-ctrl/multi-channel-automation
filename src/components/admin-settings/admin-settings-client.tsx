"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type OperationsSettings = {
  emailProvider: "resend" | "gmail";
  smsProvider: "twilio";
  workerIntervalSeconds: number;
  maxRetryAttempts: number;
  maintenanceMode: boolean;
};

const defaultSettings: OperationsSettings = {
  emailProvider: "resend",
  smsProvider: "twilio",
  workerIntervalSeconds: 30,
  maxRetryAttempts: 3,
  maintenanceMode: false,
};

export function AdminSettingsClient({
  settings,
}: {
  settings: Partial<OperationsSettings> | null;
}) {
  const initialSettings = {
    ...defaultSettings,
    ...settings,
  };
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    setError("");
    setSaved(false);
    setLoading(true);

    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        emailProvider: formData.get("emailProvider"),
        smsProvider: "twilio",
        workerIntervalSeconds: Number(formData.get("workerIntervalSeconds")),
        maxRetryAttempts: Number(formData.get("maxRetryAttempts")),
        maintenanceMode: formData.get("maintenanceMode") === "on",
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.message ?? "Could not save platform settings.");
      setLoading(false);
      return;
    }

    setSaved(true);
    setLoading(false);
  }

  return (
    <form onSubmit={saveSettings} className="app-panel grid gap-4 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium">Email provider</span>
          <select
            name="emailProvider"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            defaultValue={initialSettings.emailProvider}
          >
            <option value="resend">Resend</option>
            <option value="gmail">Gmail SMTP</option>
          </select>
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium">SMS provider</span>
          <select
            name="smsProvider"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            defaultValue={initialSettings.smsProvider}
            disabled
          >
            <option value="twilio">Twilio</option>
          </select>
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium">Worker interval seconds</span>
          <Input
            name="workerIntervalSeconds"
            type="number"
            min={10}
            max={3600}
            defaultValue={initialSettings.workerIntervalSeconds}
            required
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium">Max retry attempts</span>
          <Input
            name="maxRetryAttempts"
            type="number"
            min={0}
            max={10}
            defaultValue={initialSettings.maxRetryAttempts}
            required
          />
        </label>
      </div>

      <label className="flex items-center gap-2 rounded-lg border bg-background px-3 py-3 text-sm">
        <input
          type="checkbox"
          name="maintenanceMode"
          defaultChecked={initialSettings.maintenanceMode}
        />
        Maintenance mode
      </label>

      <div className="flex items-center justify-between gap-3">
        <div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {saved ? (
            <p className="text-sm text-muted-foreground">Settings saved.</p>
          ) : null}
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}
