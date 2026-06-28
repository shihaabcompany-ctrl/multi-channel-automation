import type { AutomationMediaItem } from "@/types/database";
import type { DecryptedPlatformConnection } from "@/lib/platform-connections";

type SendInstagramPayload = {
  text: string;
  mediaItems?: AutomationMediaItem[];
  mediaUrls?: string[];
  connection: DecryptedPlatformConnection;
};

type SendResult = {
  status: "sent" | "failed";
  error: string | null;
};

const graphApiVersion = process.env.META_GRAPH_API_VERSION ?? "v20.0";

function isVideo(url: string) {
  return /\.(mp4|mov|webm)(\?|$)/i.test(url);
}

async function instagramRequest(
  igUserId: string,
  accessToken: string,
  path: string,
  body: Record<string, string>
) {
  const response = await fetch(
    `https://graph.facebook.com/${graphApiVersion}/${igUserId}/${path}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ??
        data?.message ??
        "Instagram publishing request failed."
    );
  }

  return data as { id?: string };
}

export async function sendInstagramPost({
  text,
  mediaItems = [],
  mediaUrls = [],
  connection,
}: SendInstagramPayload): Promise<SendResult> {
  const igUserId = connection.externalAccountId;
  const resolvedMediaItems = mediaItems.length
    ? mediaItems
    : mediaUrls.map((url) => ({ url, caption: null, scheduledAt: null }));

  if (!resolvedMediaItems.length) {
    return {
      status: "failed",
      error: "Instagram publishing requires an image or video URL.",
    };
  }

  try {
    let lastCreationId: string | undefined;

    for (const item of resolvedMediaItems) {
      const caption = item.caption || text || " ";
      const creation = await instagramRequest(
        igUserId,
        connection.accessToken,
        "media",
        isVideo(item.url)
          ? {
              media_type: "REELS",
              video_url: item.url,
              caption,
            }
          : {
              image_url: item.url,
              caption,
            }
      );

      lastCreationId = creation.id;

      if (!lastCreationId) {
        throw new Error("Instagram did not return a media creation ID.");
      }

      await instagramRequest(igUserId, connection.accessToken, "media_publish", {
        creation_id: lastCreationId,
      });
    }

    return { status: "sent", error: null };
  } catch (error) {
    return {
      status: "failed",
      error:
        error instanceof Error
          ? error.message
          : "Instagram publishing request failed.",
    };
  }
}
