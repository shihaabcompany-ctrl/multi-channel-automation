import { sendMessage } from "@/lib/send-message";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Automation, MessageChannel } from "@/types/database";

type Contact = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
};

type ContactGroupMemberRow = {
  contacts: Contact | Contact[] | null;
};

type RunDueAutomationsOptions = {
  limit?: number;
  now?: Date;
  companyId?: string;
};

type AutomationRunResult = {
  processed: number;
  sent: number;
  failed: number;
  errors: Array<{
    automationId: string;
    message: string;
  }>;
};

const socialChannels = new Set<MessageChannel>([
  "whatsapp",
  "instagram",
  "facebook",
  "linkedin",
]);

const accountPublishingChannels = new Set<MessageChannel>([
  "facebook",
  "instagram",
  "linkedin",
]);

function getRecipientForChannel(channel: MessageChannel, contact: Contact) {
  if (channel === "email") return contact.email;
  if (channel === "sms" || channel === "whatsapp") return contact.phone;

  return contact.email || contact.phone;
}

function flattenContacts(member: ContactGroupMemberRow) {
  if (!member.contacts) return [];

  return Array.isArray(member.contacts) ? member.contacts : [member.contacts];
}

async function getAutomationContacts(automation: Automation) {
  if (!automation.contact_group_id) return [];

  const { data, error } = await supabaseAdmin
    .from("contact_group_members")
    .select("contacts(id, name, email, phone)")
    .eq("group_id", automation.contact_group_id);

  if (error) {
    throw error;
  }

  return ((data ?? []) as ContactGroupMemberRow[])
    .flatMap(flattenContacts)
    .filter(Boolean);
}

async function processAutomation(automation: Automation) {
  let sent = 0;
  let failed = 0;

  const { error: processingError } = await supabaseAdmin
    .from("automations")
    .update({ status: "processing" })
    .eq("id", automation.id)
    .eq("status", "queued");

  if (processingError) {
    throw processingError;
  }

  for (const channel of automation.target_channels) {
    const text =
      socialChannels.has(channel) && automation.social_caption
        ? automation.social_caption
        : automation.message_text;

    if (accountPublishingChannels.has(channel)) {
      const result = await sendMessage({
        companyId: automation.company_id,
        channel,
        title: automation.title,
        text,
        recipient: null,
        mediaUrls: automation.media_urls,
        socialCaption: automation.social_caption,
        mediaItems: automation.media_items,
        emailContentBlocks: automation.email_content_blocks,
      });

      await supabaseAdmin.from("messages_log").insert({
        automation_id: automation.id,
        company_id: automation.company_id,
        channel,
        recipient: "connected account",
        status: result.status,
        error_reason: result.error,
        sent_at: result.status === "sent" ? new Date().toISOString() : null,
      });

      if (result.status === "sent") {
        sent += 1;
      } else {
        failed += 1;
      }

      continue;
    }

    const contacts = await getAutomationContacts(automation);

    if (!contacts.length) {
      throw new Error("Selected contact group has no contacts.");
    }

    for (const contact of contacts) {
      const recipient = getRecipientForChannel(channel, contact);

      let result: Awaited<ReturnType<typeof sendMessage>>;

      try {
        result = await sendMessage({
          companyId: automation.company_id,
          channel,
          title: automation.title,
          text,
          recipient,
          mediaUrls: automation.media_urls,
          socialCaption: automation.social_caption,
          mediaItems: automation.media_items,
          emailContentBlocks: automation.email_content_blocks,
        });
      } catch (error) {
        result = {
          status: "failed",
          error: error instanceof Error ? error.message : "Send failed.",
        };
      }

      await supabaseAdmin.from("messages_log").insert({
        automation_id: automation.id,
        company_id: automation.company_id,
        channel,
        recipient,
        status: result.status,
        error_reason: result.error,
        sent_at: result.status === "sent" ? new Date().toISOString() : null,
      });

      if (result.status === "sent") {
        sent += 1;
      } else {
        failed += 1;
      }
    }
  }

  await supabaseAdmin
    .from("automations")
    .update({ status: sent > 0 || failed === 0 ? "completed" : "failed" })
    .eq("id", automation.id);

  return { sent, failed };
}

export async function runDueAutomations({
  limit = 10,
  now = new Date(),
  companyId,
}: RunDueAutomationsOptions = {}): Promise<AutomationRunResult> {
  let query = supabaseAdmin
    .from("automations")
    .select("*")
    .eq("status", "queued")
    .lte("scheduled_at", now.toISOString())
    .order("scheduled_at", { ascending: true });

  if (companyId) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query.limit(limit);

  if (error) {
    throw error;
  }

  const automations = (data ?? []) as Automation[];
  const result: AutomationRunResult = {
    processed: 0,
    sent: 0,
    failed: 0,
    errors: [],
  };

  for (const automation of automations) {
    try {
      const automationResult = await processAutomation(automation);

      result.processed += 1;
      result.sent += automationResult.sent;
      result.failed += automationResult.failed;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Automation processing failed.";

      result.processed += 1;
      result.failed += 1;
      result.errors.push({ automationId: automation.id, message });

      await supabaseAdmin
        .from("automations")
        .update({ status: "failed" })
        .eq("id", automation.id);
    }
  }

  return result;
}
