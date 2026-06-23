import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { MESSAGE_CHANNEL_VALUES } from "@/lib/channels";

const automationSchema = z.object({
  title: z.string().optional().default(""),
  messageText: z.string().optional().default(""),
  targetChannels: z.array(z.enum(MESSAGE_CHANNEL_VALUES)).min(1),
  contactGroupId: z.string().uuid().nullable(),
  scheduledAt: z.string().datetime(),
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

export async function GET() {
  const session = await requireCompanyUser();

  const { data, error } = await supabaseAdmin
    .from("automations")
    .select("*, contact_groups(name)")
    .eq("company_id", session.companyId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ automations: data });
}

export async function POST(request: Request) {
  const session = await requireCompanyUser();
  const body = await request.json();
  const parsed = automationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid automation data." },
      { status: 400 }
    );
  }

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
  }

  const mediaItems = parsed.data.mediaItems.length
    ? parsed.data.mediaItems
    : parsed.data.mediaUrls.map((url) => ({
        url,
        caption: parsed.data.socialCaption,
        scheduledAt: parsed.data.scheduledAt,
      }));
  const isSocialMediaOnlyPost =
    parsed.data.targetChannels.every((channel) => socialChannelValues.has(channel)) &&
    mediaItems.length > 0;

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

  const rowsToInsert =
    mediaItems.length > 1
      ? mediaItems.map((item, index) => ({
          company_id: session.companyId,
          title: `${title} - Media ${index + 1}`,
          message_text: messageText,
          target_channels: parsed.data.targetChannels,
          contact_group_id: parsed.data.contactGroupId,
          scheduled_at: item.scheduledAt ?? parsed.data.scheduledAt,
          status: "queued",
          created_by: session.userId,
          media_urls: [item.url],
          media_items: [item],
          email_content_blocks: parsed.data.emailContentBlocks,
          social_caption: item.caption ?? parsed.data.socialCaption,
        }))
      : [
          {
            company_id: session.companyId,
            title,
            message_text: messageText,
            target_channels: parsed.data.targetChannels,
            contact_group_id: parsed.data.contactGroupId,
            scheduled_at: parsed.data.scheduledAt,
            status: "queued",
            created_by: session.userId,
            media_urls: parsed.data.mediaUrls,
            media_items: mediaItems,
            email_content_blocks: parsed.data.emailContentBlocks,
            social_caption: parsed.data.socialCaption,
          },
        ];

  const { data, error } = await supabaseAdmin
    .from("automations")
    .insert(rowsToInsert)
    .select("*");

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      automations: data,
      automation: data?.[0] ?? null,
    },
    { status: 201 }
  );
}
