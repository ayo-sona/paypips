import apiClient from "../apiClient";

export interface CreatePlanDto {
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: "daily" | "weekly" | "monthly" | "yearly";
  intervalCount: number;
  trialPeriodDays?: number;
  features: string[];
}

export interface UpdatePlanDto {
  name?: string;
  description?: string;
  amount?: number;
  currency?: string;
  interval?: "daily" | "weekly" | "monthly" | "yearly";
  intervalCount?: number;
  trialPeriodDays?: number;
  features?: string[];
  isActive?: boolean;
}

export interface Plan {
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

export const plansApi = {
  // Create plan
  create: async (data: CreatePlanDto): Promise<Plan> => {
    const response = await apiClient.post("/member-plans", data);
    return response.data.data; // Extract from wrapper
  },

  // Get all plans
  getAll: async (
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<Plan>> => {
    const response = await apiClient.get("/member-plans", {
      params: { page, limit },
    });
    // Backend returns: { statusCode, message, data: [...] }
    // We need to wrap it properly
    const plans = response.data.data || [];
    return {
      data: plans,
      meta: {
        page,
        limit,
        total: plans.length,
        totalPages: Math.ceil(plans.length / limit),
      },
    };
  },

  // Get active plans
  getActive: async (): Promise<Plan[]> => {
    const response = await apiClient.get("/member-plans/active");
    return response.data.data;
  },

  // Get plan by ID
  getById: async (id: string): Promise<Plan> => {
    const response = await apiClient.get(`/member-plans/${id}`);
    return response.data.data;
  },

  // Update plan
  update: async (id: string, data: UpdatePlanDto): Promise<Plan> => {
    const response = await apiClient.put(`/member-plans/${id}`, data);
    return response.data.data;
  },

  // Delete plan
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/member-plans/${id}`);
  },

  // Toggle plan active status
  toggleActive: async (id: string): Promise<Plan> => {
    const response = await apiClient.patch(`/member-plans/${id}/toggle`);
    return response.data.data;
  },
};
