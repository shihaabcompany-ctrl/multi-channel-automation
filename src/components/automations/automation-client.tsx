"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  Automation,
  ContactGroup,
  EmailContentBlock,
  MessageChannel,
} from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MediaUploader } from "@/components/media/media-uploader";
import { ChannelOption } from "@/components/channels/channel-option";
import { EmailContentBuilder } from "@/components/email/email-content-builder";
import { MESSAGE_CHANNELS } from "@/lib/channels";
import { getMediaLabel } from "@/lib/media-label";

const socialChannels = new Set<MessageChannel>([
  "whatsapp",
  "instagram",
  "facebook",
  "linkedin",
]);

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
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<MessageChannel[]>([]);
  const [emailContentBlocks, setEmailContentBlocks] = useState<EmailContentBlock[]>(
    []
  );
  const hasSocialChannel = selectedChannels.some((channel) =>
    socialChannels.has(channel)
  );
  const hasEmailChannel = selectedChannels.includes("email");
  const hasOnlySocialChannels =
    selectedChannels.length > 0 &&
    selectedChannels.every((channel) => socialChannels.has(channel));

  useEffect(() => {
    if (mediaUrls.length <= 1) return;
    const firstInput = document.querySelector<HTMLInputElement>(
      'input[name="scheduledAt"]'
    );
    const firstValue = firstInput?.value;

    if (!firstValue) return;

    mediaUrls.forEach((_, index) => {
      const input = document.querySelector<HTMLInputElement>(
        `input[name="mediaScheduledAt-${index}"]`
      );
      if (input && !input.value) input.value = firstValue;
    });
  }, [mediaUrls]);

  function toggleChannel(channel: MessageChannel, checked: boolean) {
    setSelectedChannels((current) => {
      if (checked) return [...new Set([...current, channel])];
      return current.filter((item) => item !== channel);
    });
  }

  async function createAutomation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const selectedChannelValues = formData.getAll("targetChannels");
    const targetChannels = MESSAGE_CHANNELS.map((channel) => channel.value).filter((channel) =>
      selectedChannelValues.includes(channel)
    );

    if (!targetChannels.length) {
      setError("Select at least one channel.");
      return;
    }

    const title = String(formData.get("title") ?? "").trim();
    const messageText = String(formData.get("messageText") ?? "").trim();
    const emailBlocks = emailContentBlocks.filter((block) =>
      block.type === "text" ? block.content.trim() : block.url
    );
    const isSocialMediaOnlyPost =
      targetChannels.length > 0 &&
      targetChannels.every((channel) => socialChannels.has(channel)) &&
      mediaUrls.length > 0;

    if (!isSocialMediaOnlyPost && !title) {
      setError("Enter a topic.");
      return;
    }

    if (!isSocialMediaOnlyPost && !messageText && !emailBlocks.length) {
      setError("Enter a message or build a promotional email.");
      return;
    }

    const scheduledAtInput = String(formData.get("scheduledAt") ?? "");
    const mediaItems = mediaUrls.map((url, index) => {
      const itemScheduleInput =
        mediaUrls.length > 1
          ? String(formData.get(`mediaScheduledAt-${index}`) ?? "")
          : scheduledAtInput;
      const itemCaption = String(
        formData.get(`mediaCaption-${index}`) ?? ""
      ).trim();

      return {
        url,
        caption: itemCaption || null,
        scheduledAt: itemScheduleInput
          ? new Date(itemScheduleInput).toISOString()
          : null,
      };
    });

    const scheduleValues = mediaItems
      .map((item) => item.scheduledAt)
      .filter(Boolean) as string[];

    const scheduledAt =
      scheduleValues[0] ??
      (scheduledAtInput ? new Date(scheduledAtInput).toISOString() : "");

    if (!scheduledAt) {
      setError("Select a schedule date and time.");
      return;
    }

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
        messageText,
        targetChannels,
        contactGroupId: formData.get("contactGroupId") || null,
        scheduledAt,
        mediaUrls,
        socialCaption: mediaItems.find((item) => item.caption)?.caption ?? null,
        mediaItems,
        emailContentBlocks: emailBlocks,
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
    setMediaUrls([]);
    setSelectedChannels([]);
    setEmailContentBlocks([]);
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
        className="app-panel grid gap-4 p-4"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Campaign Composer</h2>
            <p className="text-sm text-muted-foreground">
              Build media, audience, and schedule in one flow.
            </p>
          </div>
          <span className="hidden rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground sm:inline-flex">
            Scheduled mode
          </span>
        </div>

        <Input
          name="title"
          placeholder={
            hasOnlySocialChannels
              ? "Topic (optional for social media posts)"
              : "Automation topic"
          }
        />

        <textarea
          name="messageText"
          placeholder={
            hasOnlySocialChannels
              ? "Description (optional for social media posts)"
              : "Write your email/SMS message..."
          }
          className="min-h-32 rounded-md border bg-background px-3 py-2 text-sm"
        />

        <div className="grid gap-3 md:grid-cols-3">
          {MESSAGE_CHANNELS.map((channel) => (
            <ChannelOption
              key={channel.value}
              value={channel.value}
              label={channel.label}
              checked={selectedChannels.includes(channel.value)}
              onCheckedChange={(checked) =>
                toggleChannel(channel.value, checked)
              }
            />
          ))}

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

        <MediaUploader mediaUrls={mediaUrls} onChange={setMediaUrls} />

        {hasEmailChannel ? (
          <EmailContentBuilder
            blocks={emailContentBlocks}
            mediaUrls={mediaUrls}
            onChange={setEmailContentBlocks}
          />
        ) : null}

        {hasSocialChannel && mediaUrls.length ? (
          <div className="rounded-lg border bg-background p-4">
            <div className="mb-3">
              <h3 className="text-sm font-semibold">Media captions</h3>
              <p className="text-sm text-muted-foreground">
                Write a separate caption for each uploaded image or video.
              </p>
            </div>

            <div className="grid gap-3">
              {mediaUrls.map((url, index) => (
                <label key={url} className="space-y-2 text-sm">
                  <span className="flex items-center justify-between gap-3 font-medium">
                    <span>{getMediaLabel(url, index)} caption</span>
                    <span className="max-w-[160px] truncate rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                      Uploaded
                    </span>
                  </span>
                  <textarea
                    name={`mediaCaption-${index}`}
                    placeholder="Write caption for this image or video..."
                    className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {mediaUrls.length > 1 ? (
          <div className="rounded-lg border bg-background p-4">
            <div className="mb-3">
              <h3 className="text-sm font-semibold">Media schedule</h3>
              <p className="text-sm text-muted-foreground">
                Choose a separate date and time for each uploaded image or video.
              </p>
            </div>

            <div className="grid gap-3">
              {mediaUrls.map((url, index) => (
                <label
                  key={url}
                  className="grid gap-2 rounded-md border bg-muted/30 p-3 text-sm md:grid-cols-[1fr_240px] md:items-center"
                >
                  <span className="font-medium">{getMediaLabel(url, index)}</span>
                  <Input
                    name={`mediaScheduledAt-${index}`}
                    type="datetime-local"
                    required
                  />
                </label>
              ))}
            </div>
          </div>
        ) : (
          <Input name="scheduledAt" type="datetime-local" required />
        )}

        <Button type="submit" disabled={loading}>
          {loading ? "Scheduling..." : "Schedule Automation"}
        </Button>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>

      <div className="app-panel overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[920px]">
            <div className="grid grid-cols-7 border-b bg-muted/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
              <div>Title</div>
              <div>Channels</div>
              <div>Media</div>
              <div>Group</div>
              <div>Scheduled</div>
              <div>Status</div>
              <div className="text-right">Actions</div>
            </div>

            {automations.map((automation) => (
              <div
                key={automation.id}
                className="grid grid-cols-7 items-center border-b px-4 py-3 text-sm transition-colors last:border-b-0 hover:bg-accent/30"
              >
                <div className="font-medium">{automation.title}</div>
                <div className="text-muted-foreground">
                  {automation.target_channels.join(", ")}
                </div>
                <div>{automation.media_urls.length}</div>
                <div className="text-muted-foreground">
                  {automation.contact_groups?.name ?? "-"}
                </div>
                <div className="text-muted-foreground">
                  {automation.scheduled_at
                    ? new Date(automation.scheduled_at).toISOString().slice(0, 16)
                    : "-"}
                </div>
                <div>
                  <Badge
                    variant={
                      automation.status === "failed"
                        ? "destructive"
                        : automation.status === "completed"
                          ? "default"
                          : "outline"
                    }
                  >
                    {automation.status}
                  </Badge>
                </div>
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
              <div className="px-4 py-8 text-sm text-muted-foreground">
                No automations scheduled yet.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
