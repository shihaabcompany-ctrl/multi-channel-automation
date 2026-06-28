import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendMessage } from "@/lib/send-message";
import { MESSAGE_CHANNEL_VALUES } from "@/lib/channels";

const manualPostingSchema = z.object({
  title: z.string().optional().default(""),
  messageText: z.string().optional().default(""),
  targetChannels: z.array(z.enum(MESSAGE_CHANNEL_VALUES)).min(1),
  contactGroupId: z.string().uuid().nullable(),
  mediaUrls: z.array(z.string().url()).default([]),
  socialCaption: z.string().nullable().default(null),
  mediaItems: z
    .array(
      z.object({
        url: z.string().url(),
        caption: z.string().nullable(),
        scheduledAt: z.string().datetime().nullable(),
      })
    )
    .default([]),
  emailContentBlocks: z
    .array(
      z.discriminatedUnion("type", [
        z.object({
          id: z.string(),
          type: z.literal("text"),
          content: z.string(),
        }),
        z.object({
          id: z.string(),
          type: z.literal("image"),
          url: z.string().url(),
          alt: z.string().nullable(),
        }),
      ])
    )
    .default([]),
});

const socialChannelValues = new Set([
  "whatsapp",
  "instagram",
  "facebook",
  "linkedin",
]);

const accountPublishingChannelValues = new Set([
  "instagram",
  "facebook",
  "linkedin",
]);

export async function POST(request: Request) {
  const session = await requireCompanyUser();
  const body = await request.json();
  const parsed = manualPostingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid manual posting data." },
      { status: 400 }
    );
  }

  const isSocialMediaOnlyPost =
    parsed.data.targetChannels.every((channel) => socialChannelValues.has(channel)) &&
    parsed.data.mediaUrls.length > 0;

  const hasEmailBlocks = parsed.data.emailContentBlocks.some((block) =>
    block.type === "text" ? block.content.trim() : block.url
  );

  if (!isSocialMediaOnlyPost && !parsed.data.title.trim()) {
    return NextResponse.json({ message: "Topic is required." }, { status: 400 });
  }

  if (!isSocialMediaOnlyPost && !parsed.data.messageText.trim() && !hasEmailBlocks) {
    return NextResponse.json(
      { message: "Message or promotional email content is required." },
      { status: 400 }
    );
  }

  const title = parsed.data.title.trim() || "Social media post";
  const messageText = parsed.data.messageText.trim();
  const contactChannels = parsed.data.targetChannels.filter(
    (channel) => !accountPublishingChannelValues.has(channel)
  );

  if (contactChannels.length && !parsed.data.contactGroupId) {
    return NextResponse.json(
      { message: "Select a group for email, SMS, or WhatsApp." },
      { status: 400 }
    );
  }

  let contacts: Array<{ email: string | null; phone: string | null }> = [];

  if (parsed.data.contactGroupId) {
    const { data: group } = await supabaseAdmin
      .from("contact_groups")
      .select("id")
      .eq("id", parsed.data.contactGroupId)
      .eq("company_id", session.companyId)
      .single();

    if (!group) {
      return NextResponse.json({ message: "Group not found." }, { status: 404 });
    }

    const { data: members, error: membersError } = await supabaseAdmin
      .from("contact_group_members")
      .select("contacts(id, name, email, phone)")
      .eq("group_id", parsed.data.contactGroupId);

    if (membersError) {
      return NextResponse.json({ message: membersError.message }, { status: 500 });
    }

    contacts = (members ?? [])
      .flatMap((member) => member.contacts ?? [])
      .filter(Boolean);
  }

  let sent = 0;
  let failed = 0;

  for (const channel of parsed.data.targetChannels) {
    const text =
      parsed.data.socialCaption &&
      ["whatsapp", "instagram", "facebook", "linkedin"].includes(channel)
        ? parsed.data.socialCaption
        : messageText;

    if (accountPublishingChannelValues.has(channel)) {
      const result = await sendMessage({
        companyId: session.companyId,
        channel,
        title,
        text,
        recipient: null,
        mediaUrls: parsed.data.mediaUrls,
        socialCaption: parsed.data.socialCaption,
        mediaItems: parsed.data.mediaItems,
        emailContentBlocks: parsed.data.emailContentBlocks,
      });

      if (result.status === "sent") {
        sent += 1;
      } else {
        failed += 1;
      }

      await supabaseAdmin.from("messages_log").insert({
        automation_id: null,
        company_id: session.companyId,
        channel,
        recipient: "connected account",
        status: result.status,
        error_reason: result.error,
        sent_at: result.status === "sent" ? new Date().toISOString() : null,
      });

      continue;
    }

    for (const contact of contacts) {
      const recipient = channel === "email" ? contact.email : contact.phone;

      const result = await sendMessage({
        companyId: session.companyId,
        channel,
        title,
        text,
        recipient,
        mediaUrls: parsed.data.mediaUrls,
        socialCaption: parsed.data.socialCaption,
        mediaItems: parsed.data.mediaItems,
        emailContentBlocks: parsed.data.emailContentBlocks,
      });

      if (result.status === "sent") {
        sent += 1;
      } else {
        failed += 1;
      }

      await supabaseAdmin.from("messages_log").insert({
        automation_id: null,
        company_id: session.companyId,
        channel,
        recipient,
        status: result.status,
        error_reason: result.error,
        sent_at: result.status === "sent" ? new Date().toISOString() : null,
      });
    }
  }

  return NextResponse.json({ ok: true, sent, failed });
}
