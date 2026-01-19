'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTeamMembers } from '../../hooks/useOrganisations';
import { useMemo } from 'react';

export function MembersGrowthChart() {
  // Hook handles data fetching
  const { data: teamMembers, isLoading } = useTeamMembers();

  // UI-only: Transform data for chart
  const chartData = useMemo(() => {
    if (!teamMembers || teamMembers.length === 0) return [];

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    // Get last 6 months
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const year = currentMonth - i < 0 ? currentYear - 1 : currentYear;
      
      // Count members who joined up to this month
      const totalMembers = teamMembers.filter(m => {
        const joinedDate = new Date(m.user.created_at);
        return (joinedDate.getFullYear() < year) || 
               (joinedDate.getFullYear() === year && joinedDate.getMonth() <= monthIndex);
      }).length;

      // Count active members who joined up to this month
      const activeMembers = teamMembers.filter(m => {
        const joinedDate = new Date(m.user.created_at);
        const joinedByThisMonth = (joinedDate.getFullYear() < year) || 
                                  (joinedDate.getFullYear() === year && joinedDate.getMonth() <= monthIndex);
        return joinedByThisMonth && m.status === 'active';
      }).length;

      data.push({
        month: months[monthIndex],
        total: totalMembers,
        active: activeMembers,
        inactive: totalMembers - activeMembers,
      });
    }
    
    return data;
  }, [teamMembers]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="h-80 animate-pulse bg-gray-100 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Member Growth
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Total and active members over the last 6 months
          </p>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          No member data available
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Member Growth
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Total and active members over the last 6 months
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="month" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total" strokeWidth={2} />
          <Line type="monotone" dataKey="active" stroke="#10b981" name="Active" strokeWidth={2} />
          <Line type="monotone" dataKey="inactive" stroke="#f59e0b" name="Inactive" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}