import { Currency, PaymentGateway } from './common';
import { PlanId, BillingCycle } from './subscription';

export type MemberStatus = 'active' | 'inactive' | 'expired';
export type PaymentMethod = 'card' | 'bank_transfer' | 'ussd' | 'cash';
export type PaymentStatus = 'success' | 'pending' | 'failed' | 'refunded';

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

export interface MemberPaymentHistory {
  id: string;
  memberId: string;
  date: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  method: PaymentMethod;
  reference: string;
  description: string;
  gateway: PaymentGateway;
}

export interface MemberFilters {
  status: MemberStatus | 'all';
  plan: PlanId | 'all';
  search: string;
}

export interface AccessGrant {
  memberId: string;
  duration: number;
  durationType: 'days' | 'months';
  expiryDate: string;
  reason: string;
  grantedBy: string;
  grantedAt: string;
}

export interface MemberStats {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  newThisMonth: number;
  expiringThisMonth: number;
}