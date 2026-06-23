import type { MessageChannel, PlatformConnectionPlatform } from "@/types/database";

export const MESSAGE_CHANNELS = [
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
] satisfies Array<{
  value: MessageChannel;
  label: string;
}>;

export const MESSAGE_CHANNEL_VALUES = MESSAGE_CHANNELS.map(
  (channel) => channel.value
) as [MessageChannel, ...MessageChannel[]];

export const PLATFORM_CHANNELS = MESSAGE_CHANNELS.filter(
  (
    channel
  ): channel is {
    value: PlatformConnectionPlatform;
    label: string;
  } => !["email", "sms"].includes(channel.value)
);

export const PLATFORM_CHANNEL_VALUES = PLATFORM_CHANNELS.map(
  (channel) => channel.value
) as [PlatformConnectionPlatform, ...PlatformConnectionPlatform[]];
