import { Currency, PaymentGateway } from "./common";

// Enterprise/Business Types
export interface Enterprise {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  logo?: string;
  website?: string;
  currency: Currency;
  preferred_gateway: PaymentGateway;
  created_at: string;
  owner_id: string;
}

// Plan Types
export interface PlanFeature {
  id: string;
  name: string;
  description?: string;
  included: boolean;
}

export type PlanDuration = "weekly" | "monthly" | "quarterly" | "yearly";
export type PlanVisibility = "public" | "invite_only";

export interface SubscriptionPlan {
  id: string;
  enterprise_id: string;
  name: string;
  description?: string;
  price: number;
  currency: Currency;
  duration: PlanDuration;
  features: PlanFeature[];
  visibility: PlanVisibility;
  is_active: boolean;
  member_count: number;
  created_at: string;
  updated_at: string;
}

// Member Types
export type MemberStatus = "active" | "inactive" | "expired";
export type MembershipType = "self_signup" | "manual_add" | "invite";

/// Member type based on ACTUAL API response from /api/v1/members
export interface Member {
  // Core member fields
  id: string;
  organization_user_id: string;
  user_id: string;
  date_of_birth: string;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  medical_notes: string | null;
  check_in_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;

  // Direct user object from API
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    status: "active" | "inactive";
    email_verified: boolean;
    last_login_at: string;
    created_at: string;
    updated_at: string;
  };

  // Subscriptions array
  subscriptions: Array<{
    id: string;
    member_id: string;
    plan_id: string;
    organization_id: string;
    status: "active" | "expired" | "canceled";
    started_at: string;
    expires_at: string;
    canceled_at: string | null;
    auto_renew: boolean;
    metadata: unknown;
    created_at: string;
    updated_at: string;
    plan: {
      id: string;
      organization_id: string;
      name: string;
      description: string;
      price: number;
      currency: string;
      interval: string;
      interval_count: number;
      features: {
        features: string[];
      };
      is_active: boolean;
      created_at: string;
      updated_at: string;
    };
  }>;
}

// Payment Types
export type PaymentMethod = "card" | "bank_transfer" | "ussd";
export type PaymentStatus = "success" | "pending" | "failed" | "refunded";
export type PaymentProvider = "kora" | "paystack" | "manual";

export interface Payment {
  id: string;
  plan_name: string;
  payer_user: {
    id?: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  provider: PaymentProvider;
  provider_reference: string;
  description: string;
  is_auto_renewal: boolean;
  created_at: string;
}

// Reminder Types
export type ReminderType =
  | "payment_due"
  | "subscription_expiring"
  | "payment_failed"
  | "welcome";
export type ReminderStatus = "pending" | "sent" | "failed";
export type ReminderChannel = "email" | "sms" | "whatsapp";

export interface PaymentReminder {
  id: string;
  payer_user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  type: ReminderType;
  status: ReminderStatus;
  channels: ReminderChannel[];
  scheduled_for: string;
  sent_at?: string;
  message: string;
}

export interface ReminderTemplate {
  id: string;
  type: ReminderType;
  subject: string;
  message: string;
  channels: ReminderChannel[];
  is_active: boolean;
}

export interface AutomatedReminderSettings {
  enabled: boolean;
  days_before_expiry: number;
  channels: ReminderChannel[];
  template_id?: string;
}

// Export Types
export type ExportFormat = "csv" | "pdf" | "excel";
export type ExportType = "members" | "payments" | "revenue" | "plans";

export interface ExportRequest {
  type: ExportType;
  format: ExportFormat;
  dateRange?: {
    from: string;
    to: string;
  };
  filters?: {
    status?: MemberStatus;
    plan_id?: string;
  };
  columns?: string[];
}

// Analytics Types
export interface EnterpriseAnalytics {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  expiredMembers: number;
  newMembersThisMonth: number;
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  averageRevenuePerMember: number;
}

export interface MemberGrowth {
  month: string;
  newMembers: number;
  totalMembers: number;
  active: number;
  inactive: number;
}

export interface RevenueByMonth {
  month: string;
  revenue: number;
  previous_year?: number;
  member_count: number;
}

export interface PlanDistribution {
  plan_id: string;
  plan_name: string;
  member_count: number;
  revenue: number;
  percentage: number;
}

// Notification Types
export type NotificationType =
  | "new_member"
  | "payment_received"
  | "payment_failed"
  | "subscription_expiring"
  | "subscription_expired"
  | "member_cancelled";

export interface EnterpriseNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  member_id?: string;
  member_name?: string;
  read: boolean;
  created_at: string;
  link?: string;
}
