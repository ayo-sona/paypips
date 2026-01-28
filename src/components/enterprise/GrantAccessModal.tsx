'use client';

import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Member } from '../../types/enterprise';
import { useActivePlans } from '../../hooks/usePlans';
import { CreateSubscriptionDto } from '../../lib/api/subscriptionsApi';

interface GrantAccessModalProps {
  member: Member;
  onClose: () => void;
  onGrant: (data: CreateSubscriptionDto) => void;
}

export function GrantAccessModal({ member, onClose, onGrant }: GrantAccessModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [reason, setReason] = useState('');

  // Get member info from actual API structure
  const memberName = `${member.user.first_name} ${member.user.last_name}`.trim();
  const memberEmail = member.user.email;
  
  // Get active subscription if exists
  const activeSubscription = member.subscriptions?.find(s => s.status === 'active');
  const hasActiveSubscription = !!activeSubscription;

  // Fetch available plans from API
  const { data: plans = [], isLoading: isLoadingPlans } = useActivePlans();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlanId) {
      alert('Please select a plan');
      return;
    }

    onGrant({
      memberId: member.id,
      planId: selectedPlanId,
      metadata: {
        grantedReason: reason,
        grantedAt: new Date().toISOString(),
      },
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 z-10">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Grant Subscription Access
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Member Info */}
            <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Granting access to:</p>
              <p className="mt-1 font-medium text-gray-900 dark:text-gray-100">{memberName}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{memberEmail}</p>
              
              {/* Current Subscription Status */}
              {hasActiveSubscription && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Current Plan:</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {activeSubscription.plan.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Expires: {new Date(activeSubscription.expires_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Warning if member has active subscription */}
            {hasActiveSubscription && (
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    This member already has an active subscription. Creating a new subscription may override or conflict with the existing one.
                  </p>
                </div>
              </div>
            )}

            {/* Plan Selection */}
            <div>
              <label htmlFor="plan" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Plan *
              </label>
              {isLoadingPlans ? (
                <div className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                  Loading plans...
                </div>
              ) : (
                <select
                  id="plan"
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose a plan...</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - ₦{plan.price.toLocaleString()}/{plan.interval}
                    </option>
                  ))}
                </select>
              )}
              {!isLoadingPlans && plans.length === 0 && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  No active plans available. Please create a plan first.
                </p>
              )}
            </div>

            {/* Reason */}
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for Access Grant *
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="E.g., Complimentary access, special promotion..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={plans.length === 0 || isLoadingPlans}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Grant Access
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}