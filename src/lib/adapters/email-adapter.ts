import nodemailer from "nodemailer";
import { Resend } from "resend";

type SendEmailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string | null;
};

async function sendGmailEmail(payload: SendEmailPayload) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return {
      status: "failed" as const,
      error: "Gmail SMTP is not configured.",
    };
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
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html ?? undefined,
  });

  return {
    status: "sent" as const,
    error: null,
  };
}

async function sendResendEmail(payload: SendEmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return {
      status: "failed" as const,
      error: "Resend is not configured.",
    };
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html ?? undefined,
  });

  if (error) {
    return {
      status: "failed" as const,
      error: error.message,
    };
  }

  return {
    status: "sent" as const,
    error: null,
  };
}

export async function sendEmail(payload: SendEmailPayload) {
  try {
    if (process.env.EMAIL_PROVIDER === "gmail") {
      return await sendGmailEmail(payload);
    }

    return await sendResendEmail(payload);
  } catch (error) {
    return {
      status: "failed" as const,
      error: error instanceof Error ? error.message : "Email send failed.",
    };
  }
}
