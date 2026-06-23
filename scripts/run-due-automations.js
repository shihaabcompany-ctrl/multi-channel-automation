/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const twilio = require("twilio");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function createSupabase() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getEncryptionKey() {
  const secret = process.env.CONNECTION_ENCRYPTION_KEY || process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("CONNECTION_ENCRYPTION_KEY or JWT_SECRET is required.");
  }

  return crypto.createHash("sha256").update(secret).digest();
}

function decryptSecret(value) {
  const [iv, authTag, encrypted] = value.split(":");

  if (!iv || !authTag || !encrypted) {
    throw new Error("Invalid encrypted secret format.");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(iv, "base64")
  );

  decipher.setAuthTag(Buffer.from(authTag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderEmailContentBlocks(blocks) {
  if (!Array.isArray(blocks) || !blocks.length) return null;

  const content = blocks
    .map((block) => {
      if (block.type === "text") {
        return `<div style="font-size:16px;line-height:1.65;color:#24333a;margin:0 0 22px 0;white-space:pre-line;">${escapeHtml(block.content)}</div>`;
      }

      return `<img src="${escapeHtml(block.url)}" alt="${escapeHtml(block.alt || "")}" style="display:block;width:100%;max-width:640px;height:auto;border-radius:14px;margin:22px auto;" />`;
    })
    .join("");

  return `<!doctype html><html><body style="margin:0;padding:0;background:#f3f7f8;font-family:Inter,Arial,sans-serif;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f7f8;padding:28px 12px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border:1px solid #dbe5e7;border-radius:18px;overflow:hidden;"><tr><td style="padding:30px;">${content}</td></tr></table></td></tr></table></body></html>`;
}

async function sendGmailEmail({ to, subject, text }) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return { status: "failed", error: "Gmail SMTP is not configured." };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from: user,
    to,
    subject,
    text,
    html: arguments[0].html || undefined,
  });

  return { status: "sent", error: null };
}

async function sendResendEmail({ to, subject, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return { status: "failed", error: "Resend is not configured." };
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    text,
    html: arguments[0].html || undefined,
  });

  if (error) {
    return { status: "failed", error: error.message };
  }

  return { status: "sent", error: null };
}

async function sendEmail(payload) {
  if (process.env.EMAIL_PROVIDER === "gmail") {
    return sendGmailEmail(payload);
  }

  return sendResendEmail(payload);
}

async function sendSms({ to, text }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_PHONE;

  if (!accountSid || !authToken || !from) {
    return { status: "failed", error: "Twilio is not configured." };
  }

  const client = twilio(accountSid, authToken);

  await client.messages.create({
    body: text,
    from,
    to,
  });

  return { status: "sent", error: null };
}

async function getPlatformConnection(supabase, companyId, platform) {
  const { data, error } = await supabase
    .from("platform_connections")
    .select("external_account_id, connected_account_name, encrypted_access_token")
    .eq("company_id", companyId)
    .eq("platform", platform)
    .single();

  if (error || !data) return null;

  return {
    externalAccountId: data.external_account_id,
    connectedAccountName: data.connected_account_name,
    accessToken: decryptSecret(data.encrypted_access_token),
  };
}

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d]/g, "");
}

function getWhatsAppMediaType(url) {
  if (url.match(/\.(mp4|webm|mov)$/i)) return "video";
  if (url.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i)) return "document";
  return "image";
}

async function sendWhatsAppRequest(phoneNumberId, accessToken, body) {
  const graphApiVersion = process.env.META_GRAPH_API_VERSION || "v20.0";
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
        data?.error?.message ||
        data?.message ||
        "WhatsApp Cloud API request failed.",
    };
  }

  return { status: "sent", error: null };
}

async function sendWhatsApp({ supabase, automation, to, text }) {
  if (!to) {
    return { status: "failed", error: "Contact has no phone number." };
  }

  const connection = await getPlatformConnection(
    supabase,
    automation.company_id,
    "whatsapp"
  );

  if (!connection) {
    return {
      status: "failed",
      error: "WhatsApp connection is not configured for this company.",
    };
  }

  const recipient = normalizePhone(to);
  const mediaItems = Array.isArray(automation.media_items)
    ? automation.media_items
    : [];
  const mediaUrls = Array.isArray(automation.media_urls)
    ? automation.media_urls
    : [];
  const resolvedMediaItems = mediaItems.length
    ? mediaItems
    : mediaUrls.map((url) => ({ url, caption: null }));

  if (!resolvedMediaItems.length) {
    return sendWhatsAppRequest(
      connection.externalAccountId,
      connection.accessToken,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: "text",
        text: {
          preview_url: true,
          body: text || " ",
        },
      }
    );
  }

  let lastResult = { status: "sent", error: null };

  for (const [index, item] of resolvedMediaItems.entries()) {
    const mediaType = getWhatsAppMediaType(item.url);
    const caption = item.caption || (index === 0 ? text : null);

    lastResult = await sendWhatsAppRequest(
      connection.externalAccountId,
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

function getRecipientForChannel(channel, contact) {
  if (channel === "email") return contact.email;
  if (channel === "sms" || channel === "whatsapp") return contact.phone;
  return contact.email || contact.phone || null;
}

async function sendChannelMessage({ supabase, channel, contact, automation }) {
  const recipient = getRecipientForChannel(channel, contact);

  if (channel === "email") {
    if (!recipient) {
      return {
        recipient,
        result: { status: "failed", error: "Contact has no email." },
      };
    }

    return {
      recipient,
      result: await sendEmail({
        to: recipient,
        subject: automation.title,
        text: automation.message_text,
        html: renderEmailContentBlocks(automation.email_content_blocks),
      }),
    };
  }

  if (channel === "sms") {
    if (!recipient) {
      return {
        recipient,
        result: { status: "failed", error: "Contact has no phone." },
      };
    }

    return {
      recipient,
      result: await sendSms({
        to: recipient,
        text: automation.message_text,
      }),
    };
  }

  if (channel === "whatsapp") {
    return {
      recipient,
      result: await sendWhatsApp({
        supabase,
        automation,
        to: recipient,
        text: automation.social_caption || automation.message_text,
      }),
    };
  }

  return {
    recipient,
    result: {
      status: "failed",
      error: `${channel} integration is waiting for platform credentials. ${(automation.media_urls || []).length} media file(s) attached. ${(automation.media_items || []).filter((item) => item.caption).length} caption(s) attached.`,
    },
  };
}

async function main() {
  const supabase = createSupabase();
  const now = new Date().toISOString();

  const { data: automations, error: automationsError } = await supabase
    .from("automations")
    .select("*")
    .eq("status", "queued")
    .lte("scheduled_at", now)
    .limit(10);

  if (automationsError) {
    throw automationsError;
  }

  if (!automations.length) {
    console.log("No due automations.");
    return;
  }

  for (const automation of automations) {
    console.log(`Processing automation: ${automation.title}`);
    let sent = 0;
    let failed = 0;

    await supabase
      .from("automations")
      .update({ status: "processing" })
      .eq("id", automation.id);

    let contacts = [];

    if (automation.contact_group_id) {
      const { data: members, error: membersError } = await supabase
        .from("contact_group_members")
        .select("contacts(id, name, email, phone)")
        .eq("group_id", automation.contact_group_id);

      if (membersError) {
        console.error(membersError);
      }

      contacts = (members || [])
        .map((member) => member.contacts)
        .filter(Boolean);
    }

    for (const channel of automation.target_channels) {
      for (const contact of contacts) {
        let recipient = getRecipientForChannel(channel, contact);
        let result = null;

        try {
          const sendResult = await sendChannelMessage({
            supabase,
            channel,
            contact,
            automation,
          });
          recipient = sendResult.recipient;
          result = sendResult.result;
        } catch (error) {
          result = {
            status: "failed",
            error: error instanceof Error ? error.message : "Send failed.",
          };
        }

        await supabase.from("messages_log").insert({
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

        console.log(
          `${channel} to ${recipient || "missing recipient"}: ${result.status}`
        );
      }
    }

    await supabase
      .from("automations")
      .update({ status: sent > 0 || failed === 0 ? "completed" : "failed" })
      .eq("id", automation.id);
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
