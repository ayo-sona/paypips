import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi, CreateSubscriptionDto } from '../lib/api/subscriptionsApi';

// Get all subscriptions
export const useSubscriptions = (page: number = 1, limit: number = 10, status?: string) => {
  return useQuery({
    queryKey: ['subscriptions', page, limit, status],
    queryFn: () => subscriptionsApi.getAll(page, limit, status),
  });
};

// Get subscription by ID
export const useSubscription = (subscriptionId: string) => {
  return useQuery({
    queryKey: ['subscriptions', subscriptionId],
    queryFn: () => subscriptionsApi.getById(subscriptionId),
    enabled: !!subscriptionId,
  });
};

// Create subscription (Grant Access)
export const useCreateSubscription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateSubscriptionDto) => subscriptionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
};

// Pause subscription
export const usePauseSubscription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (subscriptionId: string) => subscriptionsApi.pause(subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
};

// Resume subscription
export const useResumeSubscription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (subscriptionId: string) => subscriptionsApi.resume(subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
};

// Cancel subscription
export const useCancelSubscription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (subscriptionId: string) => subscriptionsApi.cancel(subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
};

// Renew subscription
export const useRenewSubscription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (subscriptionId: string) => subscriptionsApi.renew(subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
};