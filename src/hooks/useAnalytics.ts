import { useQuery } from "@tanstack/react-query";
import { analyticsApi, AnalyticsOverview } from "../lib/api/analyticsApi";
import { getCurrentOrganizationId } from "../utils/organisationUtils";

// Helper to get default date range (last 30 days)
const getDefaultDateRange = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  return {
    startDate: startDate.toISOString().split('T')[0], // Format: YYYY-MM-DD
    endDate: endDate.toISOString().split('T')[0]
  };
};

// Get analytics overview
export const useAnalyticsOverview = (params: {
  period: string;
  startDate?: string;
  endDate?: string;
}) => {
  const organizationId = getCurrentOrganizationId();

  return useQuery<AnalyticsOverview, Error>({
    queryKey: ["analytics", "overview", organizationId, params],
    queryFn: () => analyticsApi.getOverview(organizationId, params),
    retry: false,
  });
};

// Get MRR (Monthly Recurring Revenue)
export const useMRR = () => {
  const organizationId = getCurrentOrganizationId();

  return useQuery({
    queryKey: ["analytics", "mrr", organizationId],
    queryFn: () => analyticsApi.getMRR(organizationId),
    retry: false,
  });
};

// Get churn rate
export const useChurn = (params: {
  period: string;
  startDate?: string;
  endDate?: string;
}) => {
  const organizationId = getCurrentOrganizationId();

  return useQuery({
    queryKey: ["analytics", "churn", organizationId, params],
    queryFn: () => analyticsApi.getChurn(organizationId, params),
    retry: false,
  });
};

// Get revenue chart data
export const useRevenueChart = (params: {
  period: string;
  startDate?: string;
  endDate?: string;
}) => {
  const organizationId = getCurrentOrganizationId();

  return useQuery({
    queryKey: ["analytics", "revenue-chart", organizationId, params],
    queryFn: () => analyticsApi.getRevenueChart(organizationId, params),
    retry: false,
  });
};

// Get plan performance
export const usePlanPerformance = () => {
  const organizationId = getCurrentOrganizationId();

  return useQuery({
    queryKey: ["analytics", "plan-performance", organizationId],
    queryFn: () => analyticsApi.getPlanPerformance(organizationId),
    retry: false,
  });
};

// Get top members
export const useTopMembers = () => {
  const organizationId = getCurrentOrganizationId();

  return useQuery({
    queryKey: ["analytics", "top-members", organizationId],
    queryFn: () => analyticsApi.getTopMembers(organizationId),
    retry: false,
  });
};
