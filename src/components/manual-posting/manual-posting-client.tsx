"use client";

import { FormEvent, useState } from "react";
import type {
  ContactGroup,
  EmailContentBlock,
  MessageChannel,
} from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type ManualPostingClientProps = {
  groups: ContactGroup[];
};

export function ManualPostingClient({ groups }: ManualPostingClientProps) {
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
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

  function toggleChannel(channel: MessageChannel, checked: boolean) {
    setSelectedChannels((current) => {
      if (checked) return [...new Set([...current, channel])];
      return current.filter((item) => item !== channel);
    });
  }

  async function sendNow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const selectedChannels = formData.getAll("targetChannels");
    const targetChannels = MESSAGE_CHANNELS.map((channel) => channel.value).filter((channel) =>
      selectedChannels.includes(channel)
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

    setError("");
    setResult("");
    setLoading(true);

    const mediaItems = mediaUrls.map((url, index) => {
      const caption = String(formData.get(`mediaCaption-${index}`) ?? "").trim();

      return {
        url,
        caption: caption || null,
        scheduledAt: null,
      };
    });

    const response = await fetch("/api/manual-posting", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        messageText,
        targetChannels,
        contactGroupId: formData.get("contactGroupId") || null,
        mediaUrls,
        socialCaption: mediaItems.find((item) => item.caption)?.caption ?? null,
        mediaItems,
        emailContentBlocks: emailBlocks,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message ?? "Could not send manual post.");
      setLoading(false);
      return;
    }

    form.reset();
    setMediaUrls([]);
    setSelectedChannels([]);
    setEmailContentBlocks([]);
    setResult(`Sent: ${data.sent}. Failed: ${data.failed}.`);
    setLoading(false);
  }

  return (
    <form onSubmit={sendNow} className="app-panel grid gap-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Instant Dispatch</h2>
          <p className="text-sm text-muted-foreground">
            Send a campaign now across selected channels.
          </p>
        </div>
        <span className="hidden rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground sm:inline-flex">
          Live mode
        </span>
      </div>

      <Input
        name="title"
        placeholder={
          hasOnlySocialChannels
            ? "Topic (optional for social media posts)"
            : "Message topic"
        }
      />

      <textarea
        name="messageText"
        placeholder={
          hasOnlySocialChannels
            ? "Description (optional for social media posts)"
            : "Write your message..."
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
          <option value="">
            No group selected
          </option>
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

      <Button type="submit" disabled={loading}>
        {loading ? "Sending..." : "Post Now"}
      </Button>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {result ? <p className="text-sm text-muted-foreground">{result}</p> : null}
    </form>
  );
}
