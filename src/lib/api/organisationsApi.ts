import apiClient from '../apiClient';

export interface TeamMember {
  id: string;
  role: 'ADMIN' | 'MEMBER' | 'STAFF';
  status: 'active' | 'inactive';
  user: {
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
}

export interface Organization {
  id: string;
  name: string;
  email: string;
  slug?: string;
  subscription_plan?: string;
  trial_ends_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationStats {
  totalUsers: number;
  totalMembers: number;
  totalPlans: number;
  activeSubscriptions: number;
}

export const organizationsApi = {
  // Get organization by slug
  getBySlug: async (slug: string): Promise<Organization> => {
    const response = await apiClient.get(`/organizations/${slug}`);
    return response.data.data;
  },

  // Select organization
  select: async (organizationId: string): Promise<Organization> => {
    const response = await apiClient.get(`/organizations/select/${organizationId}`);
    return response.data.data;
  },

  // Update my organization
  update: async (data: Partial<Organization>): Promise<Organization> => {
    const response = await apiClient.put('/organizations/me', data);
    return response.data.data;
  },

  // Get team members
  getTeamMembers: async (organizationId: string): Promise<TeamMember[]> => {
    const response = await apiClient.get(`/organizations/team/${organizationId}`);
    return response.data.data;
  },

  // Remove user from organization
  removeUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/organizations/${userId}`);
  },

  // Get organization stats
  getStats: async (): Promise<OrganizationStats> => {
    const response = await apiClient.get('/organizations/stats');
    return response.data.data;
  },
};