'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { usePlans } from '../../hooks/usePlans';
import { useMembers } from '../../hooks/useMembers';
import { useMemo } from 'react';
import { Member } from '../../types/enterprise';

export function PlanDistributionChart() {
  // ⭐ FIXED: Fetch data with correct parameters
  const { data: plansResponse, isLoading: isLoadingPlans } = usePlans();
  const { data: membersData, isLoading: isLoadingMembers } = useMembers(''); // Empty search to get all members

  // Extract plans and members from API responses
  const plans = useMemo(() => plansResponse?.data || [], [plansResponse?.data]);
  
  const members = useMemo(() => {
    if (!membersData) return [];
    if (Array.isArray(membersData)) return membersData as Member[];
    return (membersData as { data?: Member[] }).data || [];
  }, [membersData]);

  const isLoading = isLoadingPlans || isLoadingMembers;

  // UI-only: Color assignment
  const getColorForPlan = (planName: string) => {
    const colors: { [key: string]: string } = {
      'Basic': '#3b82f6',
      'Premium': '#8b5cf6',
      'VIP': '#f59e0b',
      'Student': '#10b981',
      'Corporate': '#ef4444',
      'Family': '#ec4899',
      'Trial': '#14b8a6',
    };
    
    for (const key in colors) {
      if (planName.toLowerCase().includes(key.toLowerCase())) {
        return colors[key];
      }
    }
    
    const randomColors = [
      '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', 
      '#ef4444', '#ec4899', '#14b8a6', '#f97316'
    ];
    const hash = planName.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return randomColors[hash % randomColors.length];
  };

  // ⭐ FIXED: Calculate distribution based on actual API structure
  const planDistribution = useMemo(() => {
    return plans.map(plan => {
      // Count members with ACTIVE subscriptions on this plan
      const membersOnPlan = members.filter(member => {
        // Check if member has any active subscriptions for this plan
        return member.subscriptions?.some(
          sub => sub.status === 'active' && sub.plan_id === plan.id
        );
      });
      
      const count = membersOnPlan.length;
      
      // Calculate percentage based on total members with active subscriptions
      const totalMembersWithActiveSubscriptions = members.filter(m => 
        m.subscriptions?.some(sub => sub.status === 'active')
      ).length;
      
      const percentage = totalMembersWithActiveSubscriptions > 0 
        ? (count / totalMembersWithActiveSubscriptions) * 100 
        : 0;

      return {
        planId: plan.id,
        planName: plan.name,
        count: count,
        percentage: percentage,
        color: getColorForPlan(plan.name),
      };
    });
  }, [plans, members]);

  const plansWithMembers = planDistribution.filter(p => p.count > 0);
  const plansWithoutMembers = planDistribution.filter(p => p.count === 0);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Plan Distribution
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Active members by subscription plan
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[250px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading distribution...</p>
          </div>
        </div>
      ) : plansWithMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[250px] text-gray-500 dark:text-gray-400">
          <p className="text-lg font-medium">No active subscriptions yet</p>
          <p className="text-sm mt-2">
            {plans.length} plan{plans.length !== 1 ? 's' : ''} available
          </p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={plansWithMembers}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props) => {
                  const percent = props.percent ?? 0;
                  return `${(percent * 100).toFixed(0)}%`;
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {plansWithMembers.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(31, 41, 55, 0.95)', 
                  border: '1px solid rgb(75, 85, 99)',
                  borderRadius: '0.5rem',
                  color: 'white',
                }}
                formatter={(value: number | undefined, name: string | undefined, props: { payload?: { percentage?: number; planName?: string } }) => {
                  const count = value ?? 0;
                  const percentage = props.payload?.percentage ?? 0;
                  const planName = props.payload?.planName ?? 'Unknown';
                  return [
                    `${count} member${count !== 1 ? 's' : ''} (${percentage.toFixed(1)}%)`,
                    planName
                  ];
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend - Shows ALL plans */}
          <div className="mt-4 space-y-2">
            {/* Plans with members */}
            {plansWithMembers.map((item) => (
              <div key={item.planId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {item.planName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {item.count}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
            
            {/* Plans without members */}
            {plansWithoutMembers.length > 0 && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Plans with no active members:
                  </p>
                </div>
                {plansWithoutMembers.map((item) => (
                  <div key={item.planId} className="flex items-center justify-between opacity-60">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.planName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        0
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        (0.0%)
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}