import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi, UpdateMemberDto } from '../lib/api/membersApi';

// Get all members
export const useMembers = (search?: string) => {
  return useQuery({
    queryKey: ['members', search],
    queryFn: () => membersApi.getAll(search),
  });
};

// Get member by ID
export const useMember = (id: string) => {
  return useQuery({
    queryKey: ['members', id],
    queryFn: () => membersApi.getById(id),
    enabled: !!id,
  });
};

// Update member
export const useUpdateMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMemberDto }) =>
      membersApi.update(id, data),
    onSuccess: () => {
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
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
};

// Get member stats
export const useMemberStats = (id: string) => {
  return useQuery({
    queryKey: ['members', id, 'stats'],
    queryFn: () => membersApi.getStats(id),
    enabled: !!id,
  });
};