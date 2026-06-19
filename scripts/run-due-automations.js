const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");
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
        let recipient = null;
        let result = null;

        try {
          if (channel === "email") {
            recipient = contact.email;

            if (!recipient) {
              result = { status: "failed", error: "Contact has no email." };
            } else {
              result = await sendEmail({
                to: recipient,
                subject: automation.title,
                text: automation.message_text,
              });
            }
          }

          if (channel === "sms") {
            recipient = contact.phone;

            if (!recipient) {
              result = { status: "failed", error: "Contact has no phone." };
            } else {
              result = await sendSms({
                to: recipient,
                text: automation.message_text,
              });
            }
          }

          if (!result) {
            result = { status: "failed", error: `Unsupported channel: ${channel}` };
          }
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

        console.log(
          `${channel} to ${recipient || "missing recipient"}: ${result.status}`
        );
      }
    }

    await supabase
      .from("automations")
      .update({ status: "completed" })
      .eq("id", automation.id);
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});