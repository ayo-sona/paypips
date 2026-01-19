import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plansApi, CreatePlanDto, UpdatePlanDto } from '../lib/api/plansApi';

// Get all plans
export const usePlans = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ['plans', page, limit],
    queryFn: () => plansApi.getAll(page, limit),
  });
};

// Get active plans only
export const useActivePlans = () => {
  return useQuery({
    queryKey: ['plans', 'active'],
    queryFn: () => plansApi.getActive(),
  });
};

// Get plan by ID
export const usePlan = (id: string) => {
  return useQuery({
    queryKey: ['plans', id],
    queryFn: () => plansApi.getById(id),
    enabled: !!id,
  });
};

// Create plan
export const useCreatePlan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreatePlanDto) => plansApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
};

// Update plan
export const useUpdatePlan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePlanDto }) =>
      plansApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
};

// Delete plan
export const useDeletePlan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => plansApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
};

// Toggle plan active status
export const useTogglePlan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => plansApi.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
};