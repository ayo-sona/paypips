'use client';

import { useState, useEffect, useRef } from 'react';
import { SubscriptionPlan } from '../../types/enterprise';
import { Edit, MoreVertical, Trash2, Users, Check, X, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';

interface PlansGridProps {
  plans: SubscriptionPlan[];
  onEditPlan: (plan: SubscriptionPlan) => void;
  onTogglePlanStatus: (planId: string, currentStatus: boolean) => void;
  onDeletePlan: (planId: string) => void;
}

export function PlansGrid({ plans, onEditPlan, onTogglePlanStatus, onDeletePlan }: PlansGridProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // ⭐ FIXED: Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!selectedPlan) return;

      const dropdown = dropdownRefs.current[selectedPlan];
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setSelectedPlan(null);
      }
    };

    // Add listener with a slight delay to avoid immediate closing
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedPlan]);

  const getDurationLabel = (duration: string) => {
    const labels: Record<string, string> = {
      weekly: 'per week',
      monthly: 'per month',
      quarterly: 'per quarter',
      yearly: 'per year',
    };
    return labels[duration] || duration;
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    console.log('🖊️ Edit clicked for:', plan.name);
    setSelectedPlan(null);
    onEditPlan(plan);
  };

  const handleToggleStatus = (planId: string, currentStatus: boolean) => {
    setSelectedPlan(null);
    onTogglePlanStatus(planId, currentStatus);
  };

  const handleDeletePlan = (planId: string) => {
    setSelectedPlan(null);
    onDeletePlan(planId);
  };

  const toggleDropdown = (planId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🔘 Dropdown toggle for plan:', planId);
    setSelectedPlan(selectedPlan === planId ? null : planId);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={clsx(
            'rounded-lg border-2 bg-white dark:bg-gray-800 p-6 transition-all hover:shadow-lg',
            plan.visibility === 'invite_only'
              ? 'border-purple-200 dark:border-purple-900'
              : 'border-gray-200 dark:border-gray-700'
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {plan.name}
                </h3>
                {plan.visibility === 'invite_only' && (
                  <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/20 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-400">
                    Invite Only
                  </span>
                )}
              </div>
              {plan.description && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {plan.description}
                </p>
              )}
            </div>
            
            {/* ⭐ FIXED: Dropdown Menu with proper ref */}
            <div 
              className="relative"
              ref={(el) => {
                if (el) dropdownRefs.current[plan.id] = el;
              }}
            >
              <button
                onClick={(e) => toggleDropdown(plan.id, e)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                aria-label="Plan options"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              
              {selectedPlan === plan.id && (
                <div className="absolute right-0 top-8 z-10 w-48 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1">
                  {/* Edit */}
                  <button 
                    onClick={() => handleEditPlan(plan)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Plan
                  </button>
                  
                  {/* Activate/Deactivate */}
                  <button 
                    onClick={() => handleToggleStatus(plan.id, plan.isActive)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    {plan.isActive ? (
                      <>
                        <EyeOff className="h-4 w-4" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        Activate
                      </>
                    )}
                  </button>
                  
                  {/* Delete */}
                  <button 
                    onClick={() => handleDeletePlan(plan.id)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Plan
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                ₦{plan.price.toLocaleString()}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {getDurationLabel(plan.duration)}
              </span>
            </div>
          </div>

          {/* Members Count */}
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Users className="h-4 w-4" />
            <span>{plan.memberCount} {plan.memberCount === 1 ? 'member' : 'members'}</span>
          </div>

          {/* Features */}
          <div className="mt-6 space-y-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Features
            </p>
            {plan.features.length > 0 ? (
              <ul className="space-y-2">
                {plan.features.slice(0, 4).map((feature) => (
                  <li key={feature.id} className="flex items-start gap-2 text-sm">
                    {feature.included ? (
                      <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                    )}
                    <span className={clsx(
                      feature.included
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'text-gray-500 dark:text-gray-400 line-through'
                    )}>
                      {feature.name}
                    </span>
                  </li>
                ))}
                {plan.features.length > 4 && (
                  <li className="text-sm text-gray-500 dark:text-gray-400 pl-6">
                    +{plan.features.length - 4} more feature{plan.features.length - 4 > 1 ? 's' : ''}
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No features added</p>
            )}
          </div>

          {/* Status Badge */}
          <div className="mt-6">
            <span
              className={clsx(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                plan.isActive
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              )}
            >
              {plan.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}