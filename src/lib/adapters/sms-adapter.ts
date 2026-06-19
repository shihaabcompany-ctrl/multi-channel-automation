import twilio from "twilio";

type SendSmsPayload = {
  to: string;
  text: string;
};

export async function sendSms(payload: SendSmsPayload) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_PHONE;

  if (!accountSid || !authToken || !from) {
    return {
      status: "failed" as const,
      error: "Twilio is not configured.",
    };
  }

  try {
    const client = twilio(accountSid, authToken);

    await client.messages.create({
      body: payload.text,
      from,
      to: payload.to,
    });

    return {
      status: "sent" as const,
      error: null,
    };
  } catch (error) {
    return {
      status: "failed" as const,
      error: error instanceof Error ? error.message : "SMS send failed.",
    };
  }
}