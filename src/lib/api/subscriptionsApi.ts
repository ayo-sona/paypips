import apiClient from '../apiClient';
import { PaginatedResponse } from './plansApi';
import axios from 'axios';

export interface CreateSubscriptionDto {
  memberId: string;
  planId: string;
  metadata?: Record<string, unknown>;
}

export interface Subscription {
  id: string;
  member_id: string;
  plan_id: string;
  organization_id: string;
  status: 'active' | 'paused' | 'canceled' | 'expired';
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
}

export const subscriptionsApi = {
  // ⭐ FIXED: Create subscription (no organizationId in path)
  create: async (data: CreateSubscriptionDto): Promise<Subscription> => {
    try {
      console.log('🚀 Creating subscription with data:', data);
      const response = await apiClient.post('/members/subscriptions', data);
      console.log('✅ Subscription created:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Subscription creation failed:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
      throw error;
    }
  },

  // ⭐ FIXED: Get all subscriptions (no organizationId in path)
  getAll: async (page: number = 1, limit: number = 10, status?: string): Promise<PaginatedResponse<Subscription>> => {
    const response = await apiClient.get('/members/subscriptions', {
      params: { page, limit, status },
    });
    return {
      data: response.data.data || [],
      meta: response.data.meta || {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    };
  },

  // ⭐ FIXED: Get subscription by ID
  getById: async (subscriptionId: string): Promise<Subscription> => {
    const response = await apiClient.get(`/members/subscriptions/${subscriptionId}`);
    return response.data.data;
  },

  // ⭐ FIXED: Pause subscription
  pause: async (subscriptionId: string): Promise<Subscription> => {
    const response = await apiClient.patch(`/members/subscriptions/${subscriptionId}/pause`);
    return response.data.data;
  },

  // ⭐ FIXED: Resume subscription
  resume: async (subscriptionId: string): Promise<Subscription> => {
    const response = await apiClient.patch(`/members/subscriptions/${subscriptionId}/resume`);
    return response.data.data;
  },

  // ⭐ FIXED: Cancel subscription
  cancel: async (subscriptionId: string): Promise<Subscription> => {
    const response = await apiClient.patch(`/members/subscriptions/${subscriptionId}/cancel`);
    return response.data.data;
  },

  // ⭐ FIXED: Renew subscription
  renew: async (subscriptionId: string): Promise<Subscription> => {
    const response = await apiClient.post(`/members/subscriptions/${subscriptionId}/renew`);
    return response.data.data;
  },
};