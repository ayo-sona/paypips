import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi, CreateSubscriptionDto } from '../lib/api/subscriptionsApi';
import { getCurrentOrganizationId } from '../utils/organisationUtils';

// Get all subscriptions
export const useSubscriptions = (page: number = 1, limit: number = 10, status?: string) => {
  const organizationId = getCurrentOrganizationId();
  
  return useQuery({
    queryKey: ['subscriptions', organizationId, page, limit, status],
    queryFn: () => subscriptionsApi.getAll(organizationId, page, limit, status),
  });
};

// Create subscription (Grant Access)
export const useCreateSubscription = () => {
  const queryClient = useQueryClient();
  const organizationId = getCurrentOrganizationId();
  
  return useMutation({
    mutationFn: (data: CreateSubscriptionDto) => subscriptionsApi.create(organizationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
};

// Pause subscription
export const usePauseSubscription = () => {
  const queryClient = useQueryClient();
  const organizationId = getCurrentOrganizationId();
  
  return useMutation({
    mutationFn: (subscriptionId: string) => subscriptionsApi.pause(organizationId, subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions', organizationId] });
    },
  });
};

// Resume subscription
export const useResumeSubscription = () => {
  const queryClient = useQueryClient();
  const organizationId = getCurrentOrganizationId();
  
  return useMutation({
    mutationFn: (subscriptionId: string) => subscriptionsApi.resume(organizationId, subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions', organizationId] });
    },
  });
};

// Cancel subscription
export const useCancelSubscription = () => {
  const queryClient = useQueryClient();
  const organizationId = getCurrentOrganizationId();
  
  return useMutation({
    mutationFn: (subscriptionId: string) => subscriptionsApi.cancel(organizationId, subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions', organizationId] });
    },
  });
};

// Renew subscription
export const useRenewSubscription = () => {
  const queryClient = useQueryClient();
  const organizationId = getCurrentOrganizationId();
  
  return useMutation({
    mutationFn: (subscriptionId: string) => subscriptionsApi.renew(organizationId, subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions', organizationId] });
    },
  });
};