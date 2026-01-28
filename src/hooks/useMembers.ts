import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi, UpdateMemberDto } from '../lib/api/membersApi';

// Get all members (with optional role filter)
export const useMembers = (search?: string) => {
  return useQuery({
    queryKey: ['members', search],
    queryFn: () => membersApi.getAll(search),
    retry: false,
    placeholderData: (previousData) => previousData, // ⭐ Keep previous data while loading new data
  });
};

// Get member by ID
export const useMemberById = (id: string) => {
  return useQuery({
    queryKey: ['member', id],
    queryFn: () => membersApi.getById(id),
    enabled: !!id,
    retry: false,
  });
};

// Get member stats
export const useMemberStats = (id: string) => {
  return useQuery({
    queryKey: ['member', id, 'stats'],
    queryFn: () => membersApi.getStats(id),
    enabled: !!id,
    retry: false,
  });
};

// Update member
export const useUpdateMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMemberDto }) => 
      membersApi.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate member queries
      queryClient.invalidateQueries({ queryKey: ['member', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
};

// Delete member
export const useDeleteMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => membersApi.delete(id),
    onSuccess: () => {
      // Invalidate members list
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
};