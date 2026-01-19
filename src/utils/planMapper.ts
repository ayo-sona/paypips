import { Plan } from '../lib/api/plansApi';
import { SubscriptionPlan } from '../types/enterprise';
import { Currency } from '../types/common';

/**
 * Maps backend Plan format to frontend SubscriptionPlan format
 */
export const mapPlanToSubscriptionPlan = (plan: Plan): SubscriptionPlan => {
  return {
    id: plan.id,
    enterpriseId: plan.organization_id,
    name: plan.name,
    description: plan.description,
    price: plan.price,
    currency: plan.currency as Currency,
    duration: mapIntervalToDuration(plan.interval),
    visibility: 'public',
    features: plan.features.features.map((name: string, index: number) => ({
      id: `feature_${index}`,
      name: name,
      included: true,
    })),
    isActive: plan.is_active,
    memberCount: 0,
    createdAt: plan.created_at,
    updatedAt: plan.updated_at,
  };
};

/**
 * Maps backend interval format to frontend duration format
 */
const mapIntervalToDuration = (interval: string): 'weekly' | 'monthly' | 'quarterly' | 'yearly' => {
  const mapping: Record<string, 'weekly' | 'monthly' | 'quarterly' | 'yearly'> = {
    'week': 'weekly',
    'month': 'monthly',
    'quarter': 'quarterly',
    'year': 'yearly',
  };
  
  return mapping[interval] || 'monthly';
};

/**
 * Maps multiple plans
 */
export const mapPlansToSubscriptionPlans = (plans: Plan[]): SubscriptionPlan[] => {
  return plans.map(mapPlanToSubscriptionPlan);
};