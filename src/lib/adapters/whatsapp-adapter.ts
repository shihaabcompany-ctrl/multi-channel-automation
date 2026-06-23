import type {
  AutomationMediaItem,
} from "@/types/database";
import type { DecryptedPlatformConnection } from "@/lib/platform-connections";

type SendWhatsAppPayload = {
  to: string | null;
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

function normalizePhone(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

function getWhatsAppMediaType(url: string) {
  if (url.match(/\.(mp4|webm|mov)$/i)) return "video";
  if (url.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i)) return "document";
  return "image";
}

async function sendWhatsAppRequest(
  phoneNumberId: string,
  accessToken: string,
  body: unknown
): Promise<SendResult> {
  const response = await fetch(
    `https://graph.facebook.com/${graphApiVersion}/${phoneNumberId}/messages`,
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
    return {
      status: "failed",
      error:
        data?.error?.message ??
        data?.message ??
        "WhatsApp Cloud API request failed.",
    };
  }

  return {
    status: "sent",
    error: null,
  };
}

export async function sendWhatsApp({
  to,
  text,
  mediaItems = [],
  mediaUrls = [],
  connection,
}: SendWhatsAppPayload): Promise<SendResult> {
  if (!to) {
    return {
      status: "failed",
      error: "Contact has no phone number.",
    };
  }

  const recipient = normalizePhone(to);
  const phoneNumberId = connection.externalAccountId;

  const resolvedMediaItems = mediaItems.length
    ? mediaItems
    : mediaUrls.map((url) => ({
        url,
        caption: null,
        scheduledAt: null,
      }));

  if (!resolvedMediaItems.length) {
    return sendWhatsAppRequest(phoneNumberId, connection.accessToken, {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipient,
      type: "text",
      text: {
        preview_url: true,
        body: text || " ",
      },
    });
  }

  let lastResult: SendResult = {
    status: "sent",
    error: null,
  };

  for (const [index, item] of resolvedMediaItems.entries()) {
    const mediaType = getWhatsAppMediaType(item.url);
    const caption = item.caption ?? (index === 0 ? text : null);

    lastResult = await sendWhatsAppRequest(
      phoneNumberId,
      connection.accessToken,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: mediaType,
        [mediaType]: {
          link: item.url,
          caption: caption || undefined,
        },
      }
    );

    if (lastResult.status === "failed") return lastResult;
  }

  return lastResult;
}
