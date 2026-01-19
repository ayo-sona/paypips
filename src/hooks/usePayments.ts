import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi, InitializePaymentDto } from '../lib/api/paymentsApi';

// Get all payments
export const usePayments = (page: number = 1, limit: number = 10, status?: string) => {
  return useQuery({
    queryKey: ['payments', page, limit, status],
    queryFn: () => paymentsApi.getAll(page, limit, status),
  });
};

// Get payment by ID
export const usePayment = (id: string) => {
  return useQuery({
    queryKey: ['payments', id],
    queryFn: () => paymentsApi.getById(id),
    enabled: !!id,
  });
};

// Get payment stats
export const usePaymentStats = () => {
  return useQuery({
    queryKey: ['payments', 'stats'],
    queryFn: () => paymentsApi.getStats(),
  });
};

// Get member payments
export const useMemberPayments = (memberId: string, page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ['payments', 'member', memberId, page, limit],
    queryFn: () => paymentsApi.getMemberPayments(memberId, page, limit),
    enabled: !!memberId,
  });
};

// Initialize payment
export const useInitializePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: InitializePaymentDto) => paymentsApi.initialize(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
};

// Verify payment
export const useVerifyPayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (reference: string) => paymentsApi.verify(reference),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
};