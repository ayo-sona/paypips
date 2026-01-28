import apiClient from "../apiClient";

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
  payer_user: {
    first_name: string;
    last_name: string;
    email: string;
  };
  amount: number;
  currency: string;
  status: string;
  reference: string;
  provider: string;
  provider_reference: string;
  description?: string;
  metadata?: Record<string, unknown>; // Changed from any to unknown
  invoice: {
    member_subscription: {
      plan: { name: string };
      auto_renew: boolean;
    };
    organization_subscription: {
      plan: { name: string };
      auto_renew: boolean;
    };
  };
  created_at: string;
  updated_at: string;
}

export interface PaymentStats {
  total_revenue: number;
  total_expenses: number;
  total_profit: number;
  successful_payments: number;
  failed_payments: number;
  pending_payments: number;
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
    const response = await apiClient.post("/payments/initialize", data);
    return response.data.data;
  },

  // Get all payments
  getAll: async (
    page: number = 1,
    limit: number = 10,
    status?: string,
  ): Promise<PaginatedResponse<Payment>> => {
    const response = await apiClient.get("/payments", {
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
    const response = await apiClient.get("/payments/stats");
    return response.data.data;
  },

  // Get member payments
  getMemberPayments: async (
    memberId: string,
    page: number = 1,
    limit: number = 10,
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
