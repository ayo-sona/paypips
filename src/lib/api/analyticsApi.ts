import apiClient from "../apiClient";

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
    // Optional - backend will add these
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

export const analyticsApi = {
  // Get overview - requires organizationId
  getOverview: async (
    organizationId: string,
    params: { period: string; startDate?: string; endDate?: string },
  ): Promise<AnalyticsOverview> => {
    console.log(params);
    const response = await apiClient.get(
      `/analytics/overview/${organizationId}?startDate=${params?.startDate}&endDate=${params?.endDate}&period=${params.period}`,
    );
    return response.data.data; // Extract from wrapper
  },

  // Get MRR (Monthly Recurring Revenue)
  getMRR: async (organizationId: string) => {
    const response = await apiClient.get(`/analytics/mrr/${organizationId}`);
    return response.data.data;
  },

  // Get churn rate
  getChurn: async (
    organizationId: string,
    params: { period: string; startDate?: string; endDate?: string },
  ) => {
    const response = await apiClient.get(
      `/analytics/churn/${organizationId}?startDate=${params?.startDate}&endDate=${params?.endDate}&period=${params.period}`,
    );
    return response.data.data;
  },

  // Get revenue chart data
  getRevenueChart: async (
    organizationId: string,
    params: { period: string; startDate?: string; endDate?: string },
  ) => {
    const response = await apiClient.get(
      `/analytics/revenue-chart/${organizationId}?startDate=${params?.startDate}&endDate=${params?.endDate}&period=${params.period}`,
    );
    return response.data.data;
  },

  // Get plan performance
  getPlanPerformance: async (organizationId: string) => {
    const response = await apiClient.get(
      `/analytics/plan-performance/${organizationId}`,
    );
    return response.data.data;
  },

  // Get top members
  getTopMembers: async (organizationId: string) => {
    const response = await apiClient.get(
      `/analytics/top-members/${organizationId}`,
    );
    return response.data.data;
  },
};
