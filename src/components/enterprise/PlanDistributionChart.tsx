'use client';

import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { MOCK_MEMBERS, MOCK_PLANS } from '../../lib/mockData/enterpriseMockdata';
import { SubscriptionPlan } from '../../types/enterprise';

// Same fetch function as PlansPage
const fetchPlans = async (): Promise<SubscriptionPlan[]> => {
  // TODO: Replace with actual API call
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('enterprise_plans');
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return MOCK_PLANS;
};

export function PlanDistributionChart() {
  // Fetch plans from TanStack Query (same cache as PlansPage)
  const { data: plans = MOCK_PLANS } = useQuery({
    queryKey: ['plans'],
    queryFn: fetchPlans,
  });

  // Calculate plan distribution - SHOWS ALL PLANS (even with 0 members)
  const planDistribution = plans.map(plan => {
    const membersOnPlan = MOCK_MEMBERS.filter(m => m.planId === plan.id);
    const count = membersOnPlan.length;
    const percentage = MOCK_MEMBERS.length > 0 
      ? (count / MOCK_MEMBERS.length) * 100 
      : 0;

    return {
      planId: plan.id,
      planName: plan.name,
      count: count,
      percentage: percentage,
      color: getColorForPlan(plan.name),
    };
  }); // Removed filter - shows ALL plans including new ones with 0 members

  // Color assignment based on plan name
  function getColorForPlan(planName: string) {
    const colors: { [key: string]: string } = {
      'Basic': '#3b82f6',      // Blue
      'Premium': '#8b5cf6',    // Purple
      'VIP': '#f59e0b',        // Orange
      'Student': '#10b981',    // Green
      'Corporate': '#ef4444',  // Red
      'Family': '#ec4899',     // Pink
      'Trial': '#14b8a6',      // Teal
    };
    
    for (const key in colors) {
      if (planName.toLowerCase().includes(key.toLowerCase())) {
        return colors[key];
      }
    }
    
    // Generate random color for new plans
    const randomColors = [
      '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', 
      '#ef4444', '#ec4899', '#14b8a6', '#f97316'
    ];
    const hash = planName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return randomColors[hash % randomColors.length];
  }

  // Separate plans with members and without
  const plansWithMembers = planDistribution.filter(p => p.count > 0);
  const plansWithoutMembers = planDistribution.filter(p => p.count === 0);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Plan Distribution
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Members by subscription plan
        </p>
      </div>

      {plansWithMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[250px] text-gray-500 dark:text-gray-400">
          <p className="text-lg font-medium">No members yet</p>
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
                  backgroundColor: 'rgba(156, 163, 175, 0.9)', 
                  border: '1px solid rgb(229 231 235)',
                  borderRadius: '0.5rem',
                  color: 'white',
                }}
                formatter={(value: number | undefined, name: string | undefined, props: { payload?: { percentage?: number; planName?: string } }) => {
                  const count = value ?? 0;
                  const percentage = props.payload?.percentage ?? 0;
                  const planName = props.payload?.planName ?? 'Unknown';
                  return [
                    `${count} members (${percentage.toFixed(1)}%)`,
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
            
            {/* Plans without members (newly created) */}
            {plansWithoutMembers.length > 0 && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Plans with no members yet:
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