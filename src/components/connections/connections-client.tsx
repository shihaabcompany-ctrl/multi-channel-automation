"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  PlatformConnection,
  PlatformConnectionPlatform,
} from "@/types/database";
import { PLATFORM_CHANNELS } from "@/lib/channels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type SafePlatformConnection = Pick<
  PlatformConnection,
  | "id"
  | "platform"
  | "external_account_id"
  | "connected_account_name"
  | "expires_at"
  | "created_at"
  | "updated_at"
>;

type ConnectionsClientProps = {
  connections: SafePlatformConnection[];
};

export function ConnectionsClient({ connections }: ConnectionsClientProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [savingPlatform, setSavingPlatform] =
    useState<PlatformConnectionPlatform | null>(null);

  const connectionByPlatform = useMemo(() => {
    return new Map(connections.map((connection) => [connection.platform, connection]));
  }, [connections]);

  async function saveConnection(
    platform: PlatformConnectionPlatform,
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const expiresAtInput = String(formData.get("expiresAt") ?? "");
    const expiresAt = expiresAtInput
      ? new Date(expiresAtInput).toISOString()
      : null;

    setError("");
    setSavingPlatform(platform);

    const response = await fetch("/api/platform-connections", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        platform,
        connectedAccountName: formData.get("connectedAccountName"),
        externalAccountId: formData.get("externalAccountId"),
        accessToken: formData.get("accessToken"),
        refreshToken: formData.get("refreshToken") || undefined,
        expiresAt,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.message ?? "Could not save connection.");
      setSavingPlatform(null);
      return;
    }

    form.reset();
    setSavingPlatform(null);
    router.refresh();
  }

  async function removeConnection(id: string) {
    setError("");

    const response = await fetch(`/api/platform-connections/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.message ?? "Could not remove connection.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-4">
        {PLATFORM_CHANNELS.map((channel) => {
          const connection = connectionByPlatform.get(channel.value);
          const isSaving = savingPlatform === channel.value;

          return (
            <form
              key={channel.value}
              onSubmit={(event) => saveConnection(channel.value, event)}
              className="app-panel grid gap-4 p-4"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{channel.label}</h2>
                    <Badge variant={connection ? "default" : "outline"}>
                      {connection ? "Connected" : "Not connected"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {connection
                      ? connection.connected_account_name
                      : "Save this company's platform credentials."}
                  </p>
                </div>

                {connection ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeConnection(connection.id)}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  name="connectedAccountName"
                  placeholder="Connected account name"
                  defaultValue={connection?.connected_account_name ?? ""}
                  required
                />
                <Input
                  name="externalAccountId"
                  placeholder="External account ID"
                  defaultValue={connection?.external_account_id ?? ""}
                  required
                />
                <Input
                  name="expiresAt"
                  type="datetime-local"
                  defaultValue={
                    connection?.expires_at
                      ? new Date(connection.expires_at).toISOString().slice(0, 16)
                      : ""
                  }
                />
                <Input
                  name="accessToken"
                  type="password"
                  placeholder={
                    connection
                      ? "New access token required to update"
                      : "Access token"
                  }
                  required
                />
                <Input
                  name="refreshToken"
                  type="password"
                  placeholder="Refresh token (optional)"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving
                    ? "Saving..."
                    : connection
                      ? "Update Connection"
                      : "Save Connection"}
                </Button>
              </div>
            </form>
          );
        })}
      </div>
    </div>
  );
}
