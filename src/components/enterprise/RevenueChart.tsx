"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useRevenueChart } from "../../hooks/useAnalytics";
import clsx from "clsx";

type PeriodOption = {
  value: string;
  label: string;
};

const PERIOD_OPTIONS: PeriodOption[] = [
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "quarter", label: "Quarterly" },
  { value: "custom", label: "Custom" },
];

export function RevenueChart() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Build params object
  const params =
    selectedPeriod === "custom" && startDate && endDate
      ? { period: "custom", startDate, endDate }
      : { period: selectedPeriod };

  const { data: chartData, isLoading, error } = useRevenueChart(params);
  console.log("chart data", chartData);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    if (period === "custom") {
      setShowDatePicker(true);
      // Set default dates (last 30 days)
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      setStartDate(start.toISOString().split("T")[0]);
      setEndDate(end.toISOString().split("T")[0]);
    } else {
      setShowDatePicker(false);
    }
  };

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
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Revenue Trend
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Revenue from successful payments
              </p>
            </div>

            {/* Period selector */}
            <div>
              <div className="inline-flex items-center rounded-lg bg-gray-100 dark:bg-gray-700 p-1 gap-1">
                {PERIOD_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handlePeriodChange(option.value)}
                    className={clsx(
                      "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                      selectedPeriod === option.value
                        ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Date picker for custom range */}
              {showDatePicker && (
                <div className="mt-3 flex gap-2 items-center text-sm">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-gray-900 dark:text-gray-100"
                  />
                  <span className="text-gray-500 dark:text-gray-400">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-gray-900 dark:text-gray-100"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          {error
            ? "Unable to load revenue data"
            : "No revenue data available for this period"}
        </div>
      </div>
    );
  }

  // UI-only: Calculate summary stats
  const totalRevenue = chartData.reduce(
    (sum: number, d: { revenue?: number }) => sum + (d.revenue || 0),
    0,
  );
  const avgRevenue = chartData.length > 0 ? totalRevenue / chartData.length : 0;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
      {/* Header with period selector */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Revenue Trend
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Revenue from successful payments
            </p>
          </div>

          {/* Period selector */}
          <div>
            <div className="inline-flex items-center rounded-lg bg-gray-100 dark:bg-gray-700 p-1 gap-1">
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handlePeriodChange(option.value)}
                  className={clsx(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 whitespace-nowrap",
                    selectedPeriod === option.value
                      ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Date picker for custom range */}
            {showDatePicker && (
              <div className="mt-3 flex gap-2 items-center text-sm">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-gray-900 dark:text-gray-100"
                />
                <span className="text-gray-500 dark:text-gray-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-gray-900 dark:text-gray-100"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-gray-300 dark:stroke-gray-700"
          />
          <XAxis
            dataKey="month"
            className="text-gray-600 dark:text-gray-400"
            tick={{ fill: "currentColor" }}
          />
          <YAxis
            className="text-gray-600 dark:text-gray-400"
            tick={{ fill: "currentColor" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgb(31, 41, 55)",
              border: "1px solid rgb(75, 85, 99)",
              borderRadius: "0.5rem",
              color: "white",
            }}
            formatter={(value: number | undefined) => {
              const num = value ?? 0;
              return [`₦${num.toLocaleString()}`, "Revenue"];
            }}
          />
          <Legend />
          <Bar
            dataKey="revenue"
            fill="#10b981"
            name="Revenue (₦)"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Summary stats */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Total Revenue
          </p>
          <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">
            ₦{totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Average per Period
          </p>
          <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">
            ₦{avgRevenue.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
