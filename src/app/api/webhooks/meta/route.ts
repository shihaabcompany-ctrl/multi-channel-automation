import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type WhatsAppWebhookMessage = {
  from?: string;
  text?: {
    body?: string;
  };
  type?: string;
};

type WhatsAppWebhookValue = {
  metadata?: {
    phone_number_id?: string;
  };
  messages?: WhatsAppWebhookMessage[];
};

type MetaWebhookPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: WhatsAppWebhookValue;
    }>;
  }>;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (!verifyToken) {
    return new NextResponse("META_WEBHOOK_VERIFY_TOKEN is not configured.", {
      status: 500,
    });
  }

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as MetaWebhookPayload;

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const phoneNumberId = change.value?.metadata?.phone_number_id;
      const messages = change.value?.messages ?? [];

      if (!phoneNumberId || !messages.length) continue;

      const { data: connection } = await supabaseAdmin
        .from("platform_connections")
        .select("company_id")
        .eq("platform", "whatsapp")
        .eq("external_account_id", phoneNumberId)
        .single();

      if (!connection?.company_id) continue;

      for (const message of messages) {
        await supabaseAdmin.from("inbox_messages").insert({
          company_id: connection.company_id,
          channel: "whatsapp",
          sender: message.from ?? "unknown",
          content:
            message.text?.body ??
            `Received WhatsApp ${message.type ?? "message"} event.`,
          status: "unread",
          received_at: new Date().toISOString(),
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
