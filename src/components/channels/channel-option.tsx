"use client";

import type { ComponentType } from "react";
import { Mail, MessageSquare } from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaWhatsapp,
} from "react-icons/fa6";
import type { MessageChannel } from "@/types/database";

type ChannelOptionProps = {
  value: MessageChannel;
  label: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

type ChannelIcon = ComponentType<{ className?: string }>;

const channelIcons = {
  email: Mail,
  sms: MessageSquare,
  whatsapp: FaWhatsapp,
  instagram: FaInstagram,
  facebook: FaFacebookF,
  linkedin: FaLinkedinIn,
} satisfies Record<MessageChannel, ChannelIcon>;

export function ChannelOption({
  value,
  label,
  checked,
  onCheckedChange,
}: ChannelOptionProps) {
  const Icon = channelIcons[value];

  return (
    <label className="channel-tile">
      <input
        className="peer sr-only"
        type="checkbox"
        name="targetChannels"
        value={value}
        checked={checked}
        onChange={(event) => onCheckedChange?.(event.target.checked)}
      />
      <span className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors peer-checked:bg-primary peer-checked:text-primary-foreground">
        <Icon className="size-4" />
      </span>
      <span className="relative z-10">
        <span className="block font-medium">{label}</span>
        <span className="text-xs text-muted-foreground peer-checked:text-accent-foreground/70">
          Ready channel
        </span>
      </span>
    </label>
  );
}
