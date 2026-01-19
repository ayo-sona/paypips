'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PlansGrid } from '../../../components/enterprise/PlansGrid';
import { CreatePlanModal } from '../../../components/enterprise/CreatePlanModal';
import { usePlans, useCreatePlan, useUpdatePlan, useDeletePlan, useTogglePlan } from '../../../hooks/usePlans';
import { SubscriptionPlan } from '../../../types/enterprise';
import { mapPlansToSubscriptionPlans } from '../../../utils/planMapper';

interface PlanFormData {
  name: string;
  description: string;
  price: string;
  duration: string;
  visibility: string;
  features: Array<{ id: string; name: string; included: boolean }>;
}

export default function PlansPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  // Hooks handle ALL business logic - no localStorage, no manual state
  const { data: plansResponse, isLoading } = usePlans();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const togglePlan = useTogglePlan();

  // Map backend Plan[] to frontend SubscriptionPlan[]
  const plans = plansResponse?.data ? mapPlansToSubscriptionPlans(plansResponse.data) : [];

  // UI-only: Calculate stats from fetched data
  const stats = {
    total: plans.length,
    active: plans.filter(p => p.isActive).length,
    totalMembers: plans.reduce((sum, p) => sum + (p.memberCount || 0), 0),
    avgPrice: plans.length > 0 
      ? plans.reduce((sum, p) => sum + p.price, 0) / plans.length 
      : 0,
  };

  // UI-only: Handle modal opening
  const handleCreatePlan = () => {
    setEditingPlan(null);
    setShowCreateModal(true);
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setShowCreateModal(true);
  };

  // Event handlers - just call hooks (no business logic)
  const handleTogglePlanStatus = async (planId: string, currentStatus: boolean) => {
    try {
      await togglePlan.mutateAsync(planId);
      console.log(`${currentStatus ? 'Deactivated' : 'Activated'} plan:`, planId);
    } catch (error) {
      console.error('Failed to toggle plan status:', error);
      alert('Failed to update plan status');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (confirm(`Are you sure you want to permanently delete "${plan?.name}"? This action cannot be undone.`)) {
      try {
        await deletePlan.mutateAsync(planId);
        console.log('Deleted plan:', planId);
      } catch (error) {
        console.error('Failed to delete plan:', error);
        alert('Failed to delete plan');
      }
    }
  };

  const handleSavePlan = async (planData: PlanFormData) => {
    try {
      if (editingPlan) {
        // Update existing plan
        await updatePlan.mutateAsync({
          id: editingPlan.id,
          data: {
            name: planData.name,
            description: planData.description,
            amount: parseFloat(planData.price),
            currency: 'NGN',
            interval: planData.duration as 'daily' | 'weekly' | 'monthly' | 'yearly',
            intervalCount: 1,
            trialPeriodDays: 0,
            features: planData.features.map(f => f.name),
          },
        });
        console.log('Updated plan:', editingPlan.id, planData);
      } else {
        // Create new plan
        await createPlan.mutateAsync({
          name: planData.name,
          description: planData.description,
          amount: parseFloat(planData.price),
          currency: 'NGN',
          interval: planData.duration as 'daily' | 'weekly' | 'monthly' | 'yearly',
          intervalCount: 1,
          trialPeriodDays: 0,
          features: planData.features.map(f => f.name),
        });
        console.log('Created plan:', planData);
      }
      setShowCreateModal(false);
      setEditingPlan(null);
    } catch (error) {
      console.error('Failed to save plan:', error);
      alert('Failed to save plan');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500 dark:text-gray-400">Loading plans...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Subscription Plans
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Create and manage your membership plans
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Create Plan Button */}
          <button
            onClick={handleCreatePlan}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Plan
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Plans</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100" suppressHydrationWarning>
            {stats.total}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Active Plans</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100" suppressHydrationWarning>
            {stats.active}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Members</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100" suppressHydrationWarning>
            {stats.totalMembers}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Price</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100" suppressHydrationWarning>
            ₦{stats.avgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Plans Grid */}
      <PlansGrid 
        plans={plans}
        onEditPlan={handleEditPlan}
        onTogglePlanStatus={handleTogglePlanStatus}
        onDeletePlan={handleDeletePlan}
      />

      {/* Create/Edit Plan Modal */}
      <CreatePlanModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingPlan(null);
        }}
        onSave={handleSavePlan}
        editingPlan={editingPlan}
      />
    </div>
  );
}