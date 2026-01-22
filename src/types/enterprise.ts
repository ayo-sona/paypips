import { Currency, PaymentGateway } from './common';

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
  preferredGateway: PaymentGateway;
  createdAt: string;
  ownerId: string;
}

// Plan Types
export interface PlanFeature {
  id: string;
  name: string;
  description?: string;
  included: boolean;
}

export type PlanDuration = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type PlanVisibility = 'public' | 'invite_only';

export interface SubscriptionPlan {
  id: string;
  enterpriseId: string;
  name: string;
  description?: string;
  price: number;
  currency: Currency;
  duration: PlanDuration;
  features: PlanFeature[];
  visibility: PlanVisibility;
  isActive: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

// Member Types
export type MemberStatus = 'active' | 'inactive' | 'expired';
export type MembershipType = 'self_signup' | 'manual_add' | 'invite';

/// Member type based on ACTUAL API response from /api/v1/members
// Member type based on ACTUAL API response from /api/v1/members
export interface Member {
  id: string;
  organization_user_id: string;
  user_id: string;
  date_of_birth: string;
  address: string;
  check_in_count: number;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_notes: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  organization_user: {
    id: string;
    user_id: string;
    organization_id: string;
    role: 'ADMIN' | 'MEMBER' | 'STAFF';
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
    user?: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      phone: string;
      status: 'active' | 'inactive';
      email_verified: boolean;
      last_login_at: string;
      created_at: string;
      updated_at: string;
    };
  };
}


// Payment Types
export type PaymentMethod = 'card' | 'bank_transfer' | 'ussd';
export type PaymentStatus = 'success' | 'pending' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  enterpriseId: string;
  memberId: string;
  memberName: string;
  memberEmail: string;  // ⭐ ADD THIS FIELD - Improves UX in payments table
  planId: string;
  planName: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  method: PaymentMethod;
  reference: string;
  description: string;
  gateway?: PaymentGateway;
  isAutoRenewal: boolean;
  createdAt: string;
  paidAt?: string;
}

// Reminder Types
export type ReminderType = 'payment_due' | 'subscription_expiring' | 'payment_failed' | 'welcome';
export type ReminderStatus = 'pending' | 'sent' | 'failed';
export type ReminderChannel = 'email' | 'sms' | 'whatsapp';

export interface PaymentReminder {
  id: string;
  enterpriseId: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  type: ReminderType;
  status: ReminderStatus;
  channels: ReminderChannel[];
  scheduledFor: string;
  sentAt?: string;
  message: string;
}

export interface ReminderTemplate {
  id: string;
  enterpriseId: string;
  type: ReminderType;
  subject: string;
  message: string;
  channels: ReminderChannel[];
  isActive: boolean;
}

export interface AutomatedReminderSettings {
  enabled: boolean;
  daysBeforeExpiry: number;
  channels: ReminderChannel[];
  templateId?: string;
}

// Export Types
export type ExportFormat = 'csv' | 'pdf' | 'excel';
export type ExportType = 'members' | 'payments' | 'revenue' | 'plans';

export interface ExportRequest {
  type: ExportType;
  format: ExportFormat;
  dateRange?: {
    from: string;
    to: string;
  };
  filters?: {
    status?: MemberStatus;
    planId?: string;
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
  previousYear?: number;
  memberCount: number;
}

export interface PlanDistribution {
  planId: string;
  planName: string;
  memberCount: number;
  revenue: number;
  percentage: number;
}

// Notification Types
export type NotificationType = 
  | 'new_member'
  | 'payment_received'
  | 'payment_failed'
  | 'subscription_expiring'
  | 'subscription_expired'
  | 'member_cancelled';

export interface EnterpriseNotification {
  id: string;
  enterpriseId: string;
  type: NotificationType;
  title: string;
  message: string;
  memberId?: string;
  memberName?: string;
  read: boolean;
  createdAt: string;
  link?: string;
}