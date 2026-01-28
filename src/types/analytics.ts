import { Currency } from './common';

export interface AnalyticsCard {
  title: string;
  value: number | string;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: string;
  prefix?: string;
  suffix?: string;
}

export interface MembersGrowthData {
  month: string;
  newMembers: number;
  totalMembers: number;
  year?: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  previousYear?: number;
  currency: Currency;
}

export interface SubscriptionDistribution {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

export interface PlanDistribution {
  plan: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface DashboardAnalytics {
  memberStats: {
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
  };
  revenueStats: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  growthData: MembersGrowthData[];
  revenueData: RevenueData[];
  subscriptionDistribution: SubscriptionDistribution[];
  planDistribution: PlanDistribution[];
}

// ⭐ ADD THIS: Analytics Overview from API
export interface AnalyticsOverview {
  mrr: {
    current_mrr: number;
    previous_mrr: number;
    growth_rate: number;
    growth_amount: number;
  };
  revenue: {
    total_revenue: number;
    period_revenue: number;
    growth_rate: number;
    average_transaction: number;
  };
  members: {
    total_members: number;
    new_members: number;
    churned_members: number;
    net_growth: number;
    active_members?: number;
    inactive_members?: number;
  };
  payments: {
    total_payments: number;
    successful_payments: number;
    failed_payments: number;
    pending_payments: number;
    success_rate: number;
  };
  subscriptions: {
    total_subscriptions: number;
    active_subscriptions: number;
    expired_subscriptions: number;
    canceled_subscriptions: number;
    paused_subscriptions: number;
    new_subscriptions: number;
  };
  period: {
    start: string;
    end: string;
  };
}

// ⭐ ADD THIS: Revenue Chart Data
export interface RevenueChartData {
  month: string;
  revenue: number;
  date?: string; // Some backends might use 'date' instead
}

// ⭐ ADD THIS: Churn Data
export interface ChurnData {
  churn_rate: number;
  churned_members: number;
  total_members: number;
  period: {
    start: string;
    end: string;
  };
}

// ⭐ ADD THIS: MRR Data
export interface MRRData {
  current_mrr: number;
  previous_mrr: number;
  growth_rate: number;
  growth_amount: number;
}

// ⭐ ADD THIS: Plan Performance
export interface PlanPerformanceData {
  plan_id: string;
  plan_name: string;
  active_subscriptions: number;
  total_revenue: number;
  average_revenue_per_user: number;
}

// ⭐ ADD THIS: Top Members
export interface TopMemberData {
  member_id: string;
  member_name: string;
  total_spent: number;
  subscription_count: number;
}