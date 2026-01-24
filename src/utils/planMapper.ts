import { Plan } from '../lib/api/plansApi';
import { SubscriptionPlan } from '../types/enterprise';
import { Currency } from '../types/common';

/**
 * Maps backend Plan format to frontend SubscriptionPlan format
 */
export const mapPlanToSubscriptionPlan = (plan: Plan): SubscriptionPlan => {
  // ⭐ FIXED: Safely handle features field with proper types
  const getFeaturesArray = (): string[] => {
    if (!plan.features) return [];
    
    // If features is an object with a features array
    if (typeof plan.features === 'object' && 'features' in plan.features) {
      const featuresObj = plan.features as { features: string[] };
      return Array.isArray(featuresObj.features) ? featuresObj.features : [];
    }
    
    // If features is already an array
    if (Array.isArray(plan.features)) {
      return plan.features as string[];
    }
    
    // If features is a string, split it
    if (typeof plan.features === 'string') {
      return (plan.features as string).split(',').map((f: string) => f.trim()).filter(Boolean);
    }
    
    return [];
  };

  const featuresArray = getFeaturesArray();

  return {
    id: plan.id,
    enterpriseId: plan.organization_id,
    name: plan.name,
    description: plan.description || '',
    price: plan.price,
    currency: plan.currency as Currency,
    duration: mapIntervalToDuration(plan.interval),
    visibility: 'public', // TODO: Add to backend when needed
    features: featuresArray.map((name: string, index: number) => ({
      id: `feature_${plan.id}_${index}`,
      name: name,
      included: true,
    })),
    isActive: plan.is_active,
    memberCount: 0, // TODO: Will be populated when backend adds this field
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
    'weekly': 'weekly',
    'month': 'monthly',
    'monthly': 'monthly',
    'quarter': 'quarterly',
    'quarterly': 'quarterly',
    'year': 'yearly',
    'yearly': 'yearly',
  };
  
  return mapping[interval.toLowerCase()] || 'monthly';
};

/**
 * Maps multiple plans
 */
export const mapPlansToSubscriptionPlans = (plans: Plan[]): SubscriptionPlan[] => {
  if (!Array.isArray(plans)) return [];
  return plans.map(mapPlanToSubscriptionPlan);
}