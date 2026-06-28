import type { AutomationMediaItem } from "@/types/database";
import type { DecryptedPlatformConnection } from "@/lib/platform-connections";

type SendFacebookPayload = {
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

async function resolvePageAccessToken(pageId: string, accessToken: string) {
  const response = await fetch(
    `https://graph.facebook.com/${graphApiVersion}/${pageId}?fields=access_token&access_token=${encodeURIComponent(accessToken)}`
  );
  const data = await response.json();

  if (response.ok && typeof data?.access_token === "string") {
    return data.access_token;
  }

  return accessToken;
}

async function postToFacebook(
  pageId: string,
  accessToken: string,
  path: string,
  body: Record<string, string | boolean>
): Promise<SendResult> {
  const response = await fetch(
    `https://graph.facebook.com/${graphApiVersion}/${pageId}/${path}`,
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
    const message =
      data?.error?.message ??
      data?.message ??
      "Facebook publishing request failed.";

    return {
      status: "failed",
      error: message.includes("publish_actions")
        ? "Facebook rejected this as an old profile publishing request. Use a Facebook Page ID as External Account ID and a token with pages_manage_posts/pages_read_engagement. If you saved a user token, it must be able to read that Page access token."
        : message,
    };
  }

  return { status: "sent", error: null };
}

export async function sendFacebookPost({
  text,
  mediaItems = [],
  mediaUrls = [],
  connection,
}: SendFacebookPayload): Promise<SendResult> {
  const pageId = connection.externalAccountId;
  const pageAccessToken = await resolvePageAccessToken(
    pageId,
    connection.accessToken
  );
  const resolvedMediaItems = mediaItems.length
    ? mediaItems
    : mediaUrls.map((url) => ({ url, caption: null, scheduledAt: null }));

  if (!resolvedMediaItems.length) {
    return postToFacebook(pageId, pageAccessToken, "feed", {
      message: text || " ",
    });
  }

  let lastResult: SendResult = { status: "sent", error: null };

  for (const item of resolvedMediaItems) {
    const caption = item.caption || text || " ";

    lastResult = await postToFacebook(
      pageId,
      pageAccessToken,
      isVideo(item.url) ? "videos" : "photos",
      isVideo(item.url)
        ? { file_url: item.url, description: caption }
        : { url: item.url, caption, published: true }
    );

    if (lastResult.status === "failed") return lastResult;
  }

  return lastResult;
}
