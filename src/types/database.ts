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

export type MessageStatus = "pending" | "sent" | "failed";

export type Automation = {
  id: string;
  company_id: string;
  title: string;
  media_urls: string[];
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