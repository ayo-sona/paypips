import apiClient from '../../lib/apiClient';
import { Subscription } from '../../types/subscription';
import { PlanId, BillingCycle } from '../../types/subscription';

export const subscriptionAPI = {
  async getCurrent(): Promise<Subscription | null> {
    try {
      // TODO: Implement when backend has organization subscription endpoint
      // const response = await apiClient.get('/organizations/me/subscription');
      // return response.data.data;
      
      console.log('Fetching current organization subscription');
      
      // ✅ FIXED: Added userId and usage properties
      return {
        id: 'temp-sub-id',
        userId: 'temp-user-id',
        planId: 'basic' as PlanId,
        status: 'active',
        billingCycle: 'monthly' as BillingCycle,
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        memberCount: 0,
        usage: {
          members: 0,
          storage: 0,
          apiCalls: 0,
        },
      };
    } catch (error) {
      console.error('Failed to fetch current subscription:', error);
      return null;
    }
  },

  async changePlan(planId: PlanId, billingCycle: BillingCycle): Promise<void> {
    try {
      // TODO: Implement when backend has plan change endpoint
      // await apiClient.post('/organizations/me/subscription/change-plan', { 
      //   planId, 
      //   billingCycle 
      // });
      
      console.log('Change plan:', { planId, billingCycle });
    } catch (error) {
      console.error('Failed to change plan:', error);
      throw error;
    }
  },

  async cancel(): Promise<void> {
    try {
      // TODO: Implement when backend has subscription cancel endpoint
      // await apiClient.post('/organizations/me/subscription/cancel');
      
      console.log('Cancel subscription');
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  },

  async reactivate(): Promise<void> {
    try {
      // TODO: Implement when backend has subscription reactivate endpoint
      // await apiClient.post('/organizations/me/subscription/reactivate');
      
      console.log('Reactivate subscription');
    } catch (error) {
      console.error('Failed to reactivate subscription:', error);
      throw error;
    }
  },
};