import apiClient from '../apiClient';
import { Member } from '../../types/enterprise'; // Import the correct type

export interface UpdateMemberDto {
  date_of_birth?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_notes?: string;
  metadata?: Record<string, unknown>;
}

export const membersApi = {
  // Get all members
  getAll: async (search?: string): Promise<Member[]> => {
    const response = await apiClient.get('/members', {
      params: search ? { search } : undefined,
    });
    return response.data.data; // Extract from wrapper
  },

  // Get member by ID
  getById: async (id: string): Promise<Member> => {
    const response = await apiClient.get(`/members/${id}`);
    return response.data.data;
  },

  // Update member
  update: async (id: string, data: UpdateMemberDto): Promise<Member> => {
    const response = await apiClient.put(`/members/${id}`, data);
    return response.data.data;
  },

  // Delete member
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/members/${id}`);
  },

  // Get member stats
  getStats: async (id: string) => {
    const response = await apiClient.get(`/members/${id}/stats`);
    return response.data.data;
  },
};