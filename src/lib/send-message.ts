import { sendEmail } from "@/lib/adapters/email-adapter";
import { sendFacebookPost } from "@/lib/adapters/facebook-adapter";
import { sendInstagramPost } from "@/lib/adapters/instagram-adapter";
import { sendSms } from "@/lib/adapters/sms-adapter";
import { sendWhatsApp } from "@/lib/adapters/whatsapp-adapter";
import { renderEmailContentBlocks } from "@/lib/email-content";
import { getPlatformConnectionForCompany } from "@/lib/platform-connections";
import type {
  AutomationMediaItem,
  EmailContentBlock,
  MessageChannel,
} from "@/types/database";

type SendMessagePayload = {
  companyId: string;
  channel: MessageChannel;
  title: string;
  text: string;
  recipient: string | null;
  mediaUrls?: string[];
  socialCaption?: string | null;
  mediaItems?: AutomationMediaItem[];
  emailContentBlocks?: EmailContentBlock[];
};

export async function sendMessage(payload: SendMessagePayload) {
  if (payload.channel === "email") {
    if (!payload.recipient) {
      return { status: "failed" as const, error: "Contact has no email." };
    }

    return sendEmail({
      to: payload.recipient,
      subject: payload.title,
      text: payload.text,
      html: renderEmailContentBlocks(payload.emailContentBlocks ?? []),
    });
  }

  if (payload.channel === "sms") {
    if (!payload.recipient) {
      return { status: "failed" as const, error: "Contact has no phone." };
    }

    return sendSms({
      to: payload.recipient,
      text: payload.text,
    });
  }

  const connection = await getPlatformConnectionForCompany(
    payload.companyId,
    payload.channel
  );

  if (!connection) {
    return {
      status: "failed" as const,
      error: `${payload.channel} connection is not configured for this company.`,
    };
  }

  if (payload.channel === "whatsapp") {
    return sendWhatsApp({
      to: payload.recipient,
      text: payload.text,
      mediaUrls: payload.mediaUrls,
      mediaItems: payload.mediaItems,
      connection,
    });
  }

  if (payload.channel === "facebook") {
    return sendFacebookPost({
      text: payload.text,
      mediaUrls: payload.mediaUrls,
      mediaItems: payload.mediaItems,
      connection,
    });
  }

  if (payload.channel === "instagram") {
    return sendInstagramPost({
      text: payload.text,
      mediaUrls: payload.mediaUrls,
      mediaItems: payload.mediaItems,
      connection,
    });
  }

  return {
    status: "failed" as const,
    error: `${payload.channel} adapter is not implemented yet for ${connection.connectedAccountName}. ${payload.mediaUrls?.length ?? 0} media file(s) attached. ${payload.mediaItems?.filter((item) => item.caption).length ?? 0} caption(s) attached.`,
  };
}
