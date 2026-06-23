export type UserRole = "super_admin" | "company_owner" | "company_staff";

export type CompanyStatus = "active" | "suspended";

export type CompanyPlan = "free" | "starter" | "pro" | "enterprise";

export type Company = {
  id: string;
  name: string;
  plan: CompanyPlan;
  status: CompanyStatus;
  created_at: string;
  updated_at: string;
};

export type AppUser = {
  id: string;
  company_id: string | null;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type Contact = {
  id: string;
  company_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export type ContactGroup = {
  id: string;
  company_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type ContactGroupMember = {
  group_id: string;
  contact_id: string;
  created_at: string;
};

export type AutomationStatus =
  | "draft"
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export type MessageChannel =
  | "email"
  | "sms"
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "linkedin";

export type PlatformConnectionPlatform = Exclude<MessageChannel, "email" | "sms">;

export type MessageStatus = "pending" | "sent" | "failed";
export type InboxMessageStatus = "unread" | "read" | "archived";

export type Automation = {
  id: string;
  company_id: string;
  title: string;
  media_urls: string[];
  media_items: AutomationMediaItem[];
  email_content_blocks: EmailContentBlock[];
  social_caption: string | null;
  message_text: string;
  target_channels: MessageChannel[];
  contact_group_id: string | null;
  scheduled_at: string | null;
  recurrence: string | null;
  status: AutomationStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MessageLog = {
  id: string;
  automation_id: string | null;
  company_id: string;
  channel: MessageChannel;
  recipient: string | null;
  status: MessageStatus;
  error_reason: string | null;
  sent_at: string | null;
  created_at: string;
};

export type AutomationMediaItem = {
  url: string;
  caption: string | null;
  scheduledAt: string | null;
};

export type EmailContentBlock =
  | {
      id: string;
      type: "text";
      content: string;
    }
  | {
      id: string;
      type: "image";
      url: string;
      alt: string | null;
    };

export type PlatformConnection = {
  id: string;
  company_id: string;
  platform: PlatformConnectionPlatform;
  encrypted_access_token: string;
  encrypted_refresh_token: string | null;
  expires_at: string | null;
  external_account_id: string;
  connected_account_name: string;
  created_at: string;
  updated_at: string;
};

export type InboxMessage = {
  id: string;
  company_id: string;
  channel: MessageChannel;
  sender: string;
  content: string;
  status: InboxMessageStatus;
  received_at: string;
  created_at: string;
};

export type AuditLog = {
  id: string;
  actor_user_id: string | null;
  company_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type PlatformSetting = {
  key: string;
  value: Record<string, unknown>;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};
