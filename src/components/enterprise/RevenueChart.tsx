'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useRevenueChart } from '../../hooks/useAnalytics';

export function RevenueChart() {
  // Hook handles ALL business logic
  const { data: chartData, isLoading, error } = useRevenueChart();

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="h-80 animate-pulse bg-gray-100 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  if (error || !chartData || chartData.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Revenue Trend
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Monthly revenue from successful payments (in thousands)
          </p>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          {error ? 'Unable to load revenue data. API endpoint may not be ready.' : 'No revenue data available'}
        </div>
      </div>
    );
  }

  // UI-only: Calculate summary stats
  const totalRevenue = chartData.reduce((sum: number, d: { revenue?: number }) => sum + (d.revenue || 0), 0);
  const avgRevenue = chartData.length > 0 ? totalRevenue / chartData.length : 0;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Revenue Trend
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Monthly revenue from successful payments (in thousands)
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="month" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
            }}
            formatter={(value: number | undefined) => {
              const num = value ?? 0;
              return [`₦${num.toFixed(1)}K`, 'Revenue'];
            }}
          />
          <Legend />
          <Bar dataKey="revenue" fill="#10b981" name="Revenue (₦K)" />
        </BarChart>
      </ResponsiveContainer>

      {/* Summary stats */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Total (6 months)
          </p>
          <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100" suppressHydrationWarning>
            ₦{totalRevenue.toFixed(1)}K
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Avg per month
          </p>
          <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100" suppressHydrationWarning>
            ₦{avgRevenue.toFixed(1)}K
          </p>
        </div>
      </div>
    </div>
  );
}