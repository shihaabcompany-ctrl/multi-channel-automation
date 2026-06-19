import { sendEmail } from "@/lib/adapters/email-adapter";
import { sendSms } from "@/lib/adapters/sms-adapter";
import type { MessageChannel } from "@/types/database";

type SendMessagePayload = {
  channel: MessageChannel;
  title: string;
  text: string;
  recipient: string | null;
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

  return {
    status: "failed" as const,
    error: `Unsupported channel: ${payload.channel}`,
  };
}