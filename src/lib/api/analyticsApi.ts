import apiClient from "../apiClient";
import type {
  AnalyticsOverview,
  RevenueChartData,
  ChurnData,
  MRRData,
  PlanPerformanceData,
  TopMemberData,
} from "../../types/analytics";

export const analyticsApi = {
  // ⭐ FIXED: Get overview - properly handle optional params
  getOverview: async (
    organizationId: string,
    params: { period: string; startDate?: string; endDate?: string },
  ): Promise<AnalyticsOverview> => {
    const queryParams: Record<string, string> = { period: params.period };
    
    // Only add if they exist
    if (params.startDate) {
      queryParams.startDate = params.startDate;
    }
    if (params.endDate) {
      queryParams.endDate = params.endDate;
    }

    const response = await apiClient.get(
      `/analytics/overview/${organizationId}`,
      { params: queryParams }
    );
    return response.data.data;
  },

  // Get MRR (Monthly Recurring Revenue)
  getMRR: async (organizationId: string): Promise<MRRData> => {
    const response = await apiClient.get(`/analytics/mrr/${organizationId}`);
    return response.data.data;
  },

  // ⭐ FIXED: Get churn rate
  getChurn: async (
    organizationId: string,
    params: { period: string; startDate?: string; endDate?: string },
  ): Promise<ChurnData> => {
    const queryParams: Record<string, string> = { period: params.period };
    
    if (params.startDate) {
      queryParams.startDate = params.startDate;
    }
    if (params.endDate) {
      queryParams.endDate = params.endDate;
    }

    const response = await apiClient.get(
      `/analytics/churn/${organizationId}`,
      { params: queryParams }
    );
    return response.data.data;
  },

  // ⭐ FIXED: Get revenue chart data
  getRevenueChart: async (
    organizationId: string,
    params: { period: string; startDate?: string; endDate?: string },
  ): Promise<RevenueChartData[]> => {
    const queryParams: Record<string, string> = { period: params.period };
    
    if (params.startDate) {
      queryParams.startDate = params.startDate;
    }
    if (params.endDate) {
      queryParams.endDate = params.endDate;
    }

    const response = await apiClient.get(
      `/analytics/revenue-chart/${organizationId}`,
      { params: queryParams }
    );
    return response.data.data;
  },

  // Get plan performance
  getPlanPerformance: async (organizationId: string): Promise<PlanPerformanceData[]> => {
    const response = await apiClient.get(
      `/analytics/plan-performance/${organizationId}`,
    );
    return response.data.data;
  },

  // Get top members
  getTopMembers: async (organizationId: string): Promise<TopMemberData[]> => {
    const response = await apiClient.get(
      `/analytics/top-members/${organizationId}`,
    );
    return response.data.data;
  },
};