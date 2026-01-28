'use client';

import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/Badge';
import { PlanId, BillingCycle, PlanFeature } from '../../types/subscription';
import { PRICING_PLANS, ANNUAL_DISCOUNT } from '../../lib/constants';
import { formatCurrency, calculateAnnualPrice } from '../../lib/formatters';
import { useAuth } from '../../features/auth/authContext';
import { Currency } from '../../types/common';

interface PlanComparisonProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlanId: PlanId;
  onSelectPlan: (planId: PlanId, billingCycle: BillingCycle) => Promise<void>;
}

export function PlanComparison({ isOpen, onClose, currentPlanId, onSelectPlan }: PlanComparisonProps) {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);

  const handleSelectPlan = async (planId: PlanId) => {
    setIsLoading(true);
    setSelectedPlan(planId);
    try {
      await onSelectPlan(planId, billingCycle);
      onClose();
    } catch (error) {
      console.error('Failed to change plan:', error);
    } finally {
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  // Create plans array with proper typing - explicitly map all properties
  const currency: Currency = user?.currency || 'NGN';
  const plans = Object.values(PRICING_PLANS).map(plan => ({
    id: plan.id,
    name: plan.name,
    members: plan.members,
    price: plan.price,
    pricePerMember: plan.pricePerMember,
    features: plan.features,
    limits: plan.limits,
    popular: plan.popular,
    currency,
    billingCycle,
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choose Your Plan" size="xl">
      <div className="space-y-6">
        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annually')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              billingCycle === 'annually'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Annually
            <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
              Save 17%
            </span>
          </button>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const isCurrentPlan = plan.id === currentPlanId;
            const price = billingCycle === 'annually' 
              ? calculateAnnualPrice(plan.price, ANNUAL_DISCOUNT)
              : plan.price;

            return (
              <div
                key={plan.id}
                className={`relative border rounded-lg p-6 ${
                  isCurrentPlan
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                } ${plan.popular ? 'ring-2 ring-blue-600' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant="info">
                    Most Popular
                  </Badge>
                )}
                {isCurrentPlan && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant="success">
                    Current Plan
                  </Badge>
                )}

                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <div className="mt-2">
                    {plan.id === 'enterprise' ? (
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        Custom
                      </p>
                    ) : (
                      <>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(price, plan.currency)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          / {billingCycle}
                        </p>
                        {billingCycle === 'annually' && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            {formatCurrency(price / 12, plan.currency)} per month
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.slice(0, 5).map((feature: PlanFeature, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      {feature.included ? (
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={feature.included ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 line-through'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                {plan.id === 'enterprise' ? (
                  <Button className="w-full" variant="outline">
                    Contact Sales
                  </Button>
                ) : isCurrentPlan ? (
                  <Button className="w-full" variant="outline" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleSelectPlan(plan.id)}
                    // isLoading={isLoading && selectedPlan === plan.id}
                    disabled={isLoading}
                  >
                    {plan.id > currentPlanId ? 'Upgrade' : 'Downgrade'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-8 overflow-x-auto">
          <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Full Feature Comparison
          </h4>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Feature
                </th>
                {plans.map(plan => (
                  <th key={plan.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Members</td>
                {plans.map(plan => (
                  <td key={plan.id} className="px-6 py-4 text-sm text-center text-gray-900 dark:text-white">
                    {plan.members === 999999 ? '∞' : plan.members}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Email Notifications</td>
                {plans.map(plan => (
                  <td key={plan.id} className="px-6 py-4 text-center">
                    {plan.limits.emailNotifications ? '✓' : '–'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">SMS Notifications</td>
                {plans.map(plan => (
                  <td key={plan.id} className="px-6 py-4 text-center">
                    {plan.limits.smsNotifications ? '✓' : '–'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">WhatsApp</td>
                {plans.map(plan => (
                  <td key={plan.id} className="px-6 py-4 text-center">
                    {plan.limits.whatsappNotifications ? '✓' : '–'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Export Features</td>
                {plans.map(plan => (
                  <td key={plan.id} className="px-6 py-4 text-center">
                    {plan.limits.exportFeatures ? '✓' : '–'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">API Access</td>
                {plans.map(plan => (
                  <td key={plan.id} className="px-6 py-4 text-center">
                    {plan.limits.apiAccess ? '✓' : '–'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Priority Support</td>
                {plans.map(plan => (
                  <td key={plan.id} className="px-6 py-4 text-center">
                    {plan.limits.prioritySupport ? '✓' : '–'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}