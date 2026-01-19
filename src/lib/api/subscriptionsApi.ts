import apiClient from '../apiClient';
import { PaginatedResponse } from './plansApi';

export interface CreateSubscriptionDto {
  memberId: string;
  planId: string;
  metadata?: Record<string, unknown>;
}

export interface Subscription {
  id: string;
  member_id: string;
  plan_id: string;
  status: 'active' | 'paused' | 'canceled' | 'expired';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export const subscriptionsApi = {
  // Create subscription - requires organizationId
  create: async (organizationId: string, data: CreateSubscriptionDto): Promise<Subscription> => {
    const response = await apiClient.post(`/members/subscriptions/${organizationId}`, data);
    return response.data.data; // Extract from wrapper
  },

  // Get all subscriptions - requires organizationId
  getAll: async (organizationId: string, page: number = 1, limit: number = 10, status?: string): Promise<PaginatedResponse<Subscription>> => {
    const response = await apiClient.get(`/members/subscriptions/${organizationId}`, {
      params: { page, limit, status },
    });
    // Backend returns paginated response
    const subscriptions = response.data.data || [];
    return {
      data: subscriptions,
      meta: response.data.meta || {
        page,
        limit,
        total: subscriptions.length,
        totalPages: Math.ceil(subscriptions.length / limit),
      },
    };
  },

  // Pause subscription
  pause: async (organizationId: string, subscriptionId: string): Promise<Subscription> => {
    const response = await apiClient.patch(`/members/subscriptions/${organizationId}/${subscriptionId}/pause`);
    return response.data.data;
  },

  // Resume subscription
  resume: async (organizationId: string, subscriptionId: string): Promise<Subscription> => {
    const response = await apiClient.patch(`/members/subscriptions/${organizationId}/${subscriptionId}/resume`);
    return response.data.data;
  },

  // Cancel subscription
  cancel: async (organizationId: string, subscriptionId: string): Promise<Subscription> => {
    const response = await apiClient.patch(`/members/subscriptions/${organizationId}/${subscriptionId}/cancel`);
    return response.data.data;
  },

  // Renew subscription
  renew: async (organizationId: string, subscriptionId: string): Promise<Subscription> => {
    const response = await apiClient.post(`/members/subscriptions/${organizationId}/${subscriptionId}/renew`);
    return response.data.data;
  },
};