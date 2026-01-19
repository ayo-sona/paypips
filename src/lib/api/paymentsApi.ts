import apiClient from '../apiClient';

export interface InitializePaymentDto {
  memberId: string;
  amount: number;
  currency: string;
  method: string;
  description?: string;
  paidAt?: string;
}

export interface Payment {
  id: string;
  organization_id: string;
  member_id: string;
  member_name: string;
  member_email: string;
  amount: number;
  currency: string;
  status: 'pending' | 'successful' | 'failed';
  reference: string;
  gateway: string;
  method: string;
  description?: string;
  metadata?: Record<string, unknown>; // Changed from any to unknown
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentStats {
  totalRevenue: number;
  monthlyRevenue: number;
  monthlyPayments: number;
  platformPayments: number;
  manualPayments: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const paymentsApi = {
  // Initialize payment
  initialize: async (data: InitializePaymentDto): Promise<Payment> => {
    const response = await apiClient.post('/payments/initialize', data);
    return response.data.data;
  },

  // Get all payments
  getAll: async (
    page: number = 1,
    limit: number = 10,
    status?: string
  ): Promise<PaginatedResponse<Payment>> => {
    const response = await apiClient.get('/payments', {
      params: { page, limit, status },
    });
    const payments = response.data.data || [];
    return {
      data: payments,
      meta: {
        page,
        limit,
        total: payments.length,
        totalPages: Math.ceil(payments.length / limit),
      },
    };
  },

  // Get payment by ID
  getById: async (id: string): Promise<Payment> => {
    const response = await apiClient.get(`/payments/${id}`);
    return response.data.data;
  },

  // Get payment stats
  getStats: async (): Promise<PaymentStats> => {
    const response = await apiClient.get('/payments/stats');
    return response.data.data;
  },

  // Get member payments
  getMemberPayments: async (
    memberId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<Payment>> => {
    const response = await apiClient.get(`/payments/member/${memberId}`, {
      params: { page, limit },
    });
    const payments = response.data.data || [];
    return {
      data: payments,
      meta: {
        page,
        limit,
        total: payments.length,
        totalPages: Math.ceil(payments.length / limit),
      },
    };
  },

  // Verify payment
  verify: async (reference: string): Promise<Payment> => {
    const response = await apiClient.post(`/payments/verify/${reference}`);
    return response.data.data;
  },
};