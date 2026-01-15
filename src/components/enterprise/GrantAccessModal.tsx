'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, AlertCircle } from 'lucide-react';
import { Member, AccessGrant } from '../../types/member';
import { SubscriptionPlan } from '../../types/enterprise';
import { MOCK_PLANS } from '../../lib/mockData/enterpriseMockdata';

interface GrantAccessModalProps {
  member: Member;
  onClose: () => void;
  onGrant: (data: Omit<AccessGrant, 'grantedBy' | 'grantedAt' | 'memberId'> & { 
    planId: string; 
    planName: string;
    applyMode: 'override' | 'queue';
  }) => void;
}

// Same fetch function as PlansPage
const fetchPlans = async (): Promise<SubscriptionPlan[]> => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('enterprise_plans');
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return MOCK_PLANS;
};

export function GrantAccessModal({ member, onClose, onGrant }: GrantAccessModalProps) {
  const [duration, setDuration] = useState('30');
  const [durationType, setDurationType] = useState<'days' | 'months'>('days');
  const [reason, setReason] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [applyMode, setApplyMode] = useState<'override' | 'queue'>('queue');
  const [showOverrideWarning, setShowOverrideWarning] = useState(false);

  // Fetch plans from TanStack Query
  const { data: plans = MOCK_PLANS } = useQuery({
    queryKey: ['plans'],
    queryFn: fetchPlans,
  });

  // Check if member has active subscription (not expired)
  const hasActiveSubscription = member.status === 'active' && member.subscriptionExpiryDate;
  
  // Check if subscription is actually expired by date
  const isExpiredByDate = new Date(member.subscriptionExpiryDate) < new Date();
  
  // Only show override/queue options if member is truly active (not expired by date)
  const showApplyModeOptions = hasActiveSubscription && !isExpiredByDate;
  
  // Get current plan name from subscriptionPlan
  const currentPlan = plans.find(p => p.id === member.subscriptionPlan);
  const currentPlanName = currentPlan?.name || 'Current Plan';
  
  // Calculate remaining days on current plan
  const getRemainingDays = () => {
    if (!hasActiveSubscription || !member.subscriptionExpiryDate) return 0;
    const expiryDate = new Date(member.subscriptionExpiryDate);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const remainingDays = getRemainingDays();

  // Calculate new access duration in days
  const getNewDurationInDays = () => {
    const durationNum = parseInt(duration);
    if (durationType === 'days') {
      return durationNum;
    } else {
      return durationNum * 30; // Approximate months to days
    }
  };

  const newDurationInDays = getNewDurationInDays();

  // Check if override is allowed (new duration must be >= remaining duration)
  const canOverride = newDurationInDays >= remainingDays;

  // Handle override attempt - auto-switch to queue if not allowed
  const handleApplyModeChange = (mode: 'override' | 'queue') => {
    if (mode === 'override' && !canOverride) {
      setShowOverrideWarning(true);
      return;
    }
    setApplyMode(mode);
  };

  const calculateExpiryDate = () => {
    const date = new Date();
    
    if (applyMode === 'queue' && showApplyModeOptions && member.subscriptionExpiryDate) {
      // Start from current plan's expiry date
      date.setTime(new Date(member.subscriptionExpiryDate).getTime());
    }
    
    if (durationType === 'days') {
      date.setDate(date.getDate() + parseInt(duration));
    } else {
      date.setMonth(date.getMonth() + parseInt(duration));
    }
    return date.toISOString().split('T')[0];
  };

  const handleOverrideAttempt = () => {
    if (!canOverride) {
      setShowOverrideWarning(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedPlan = plans.find(p => p.id === selectedPlanId);
    if (!selectedPlan) {
      alert('Please select a plan');
      return;
    }

    onGrant({
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      duration: parseInt(duration),
      durationType,
      expiryDate: calculateExpiryDate(),
      reason,
      applyMode,
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
              Grant Access
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
              <p className="mt-1 font-medium text-gray-900 dark:text-gray-100">{member.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{member.email}</p>
              
              {/* Current Plan Status */}
              {hasActiveSubscription && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Current Plan:</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{currentPlanName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Expires: {new Date(member.subscriptionExpiryDate).toLocaleDateString()} ({remainingDays} days remaining)
                  </p>
                </div>
              )}
            </div>

            {/* Plan Selection */}
            <div>
              <label htmlFor="plan" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Plan *
              </label>
              <select
                id="plan"
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="">Choose a plan...</option>
                {plans.filter(p => p.isActive).map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - ₦{plan.price.toLocaleString()}/{plan.duration}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Access Duration *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  id="duration"
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
                <select
                  value={durationType}
                  onChange={(e) => setDurationType(e.target.value as 'days' | 'months')}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="days">Days</option>
                  <option value="months">Months</option>
                </select>
              </div>
            </div>

            {/* Apply Mode (only show if member has active subscription) */}
            {showApplyModeOptions && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  How to Apply Access
                </label>
                <div className="space-y-2">
                  {/* Override Option */}
                  <label 
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      canOverride 
                        ? applyMode === 'override'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-60'
                    }`}
                    onClick={canOverride ? undefined : handleOverrideAttempt}
                  >
                    <input
                      type="radio"
                      name="applyMode"
                      value="override"
                      checked={applyMode === 'override'}
                      onChange={(e) => handleApplyModeChange(e.target.value as 'override' | 'queue')}
                      disabled={!canOverride}
                      className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Override current plan
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        Replace existing plan immediately. Current plan ends today.
                      </p>
                      {!canOverride && (
                        <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400">
                          <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                          <span>New duration ({newDurationInDays} days) must be ≥ remaining time ({remainingDays} days)</span>
                        </div>
                      )}
                    </div>
                  </label>

                  {/* Queue Option */}
                  <label 
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      applyMode === 'queue'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="applyMode"
                      value="queue"
                      checked={applyMode === 'queue'}
                      onChange={(e) => handleApplyModeChange(e.target.value as 'override' | 'queue')}
                      className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Queue after current plan
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        Start new access after current plan expires on {new Date(member.subscriptionExpiryDate).toLocaleDateString()}
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Expiry Date Preview */}
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {applyMode === 'queue' && showApplyModeOptions ? (
                  <>New access starts: <strong>{member.subscriptionExpiryDate}</strong> and expires: <strong>{calculateExpiryDate()}</strong></>
                ) : (
                  <>Access expires on: <strong>{calculateExpiryDate()}</strong></>
                )}
              </p>
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
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Grant Access
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Override Warning Modal */}
      {showOverrideWarning && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowOverrideWarning(false)}
          />
          <div className="relative w-full max-w-sm rounded-lg border border-red-200 dark:border-red-900 bg-white dark:bg-gray-800 shadow-xl p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Cannot Override Plan
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  The new access duration ({newDurationInDays} days) must be equal to or longer than the remaining time on the current plan ({remainingDays} days).
                </p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Please either:
                </p>
                <ul className="mt-1 ml-4 text-sm text-gray-600 dark:text-gray-400 list-disc">
                  <li>Increase the duration to at least {remainingDays} days</li>
                  <li>Use &ldquo;Queue after current plan&rdquo; option</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowOverrideWarning(false)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}