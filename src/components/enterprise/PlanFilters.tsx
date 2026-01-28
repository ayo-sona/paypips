"use client";

import { Filter, X } from "lucide-react";

interface PlanFiltersType {
  status: "all" | "active" | "inactive";
  duration: "all" | "weekly" | "monthly" | "quarterly" | "yearly";
  priceMin: string;
  priceMax: string;
}

interface PlanFiltersProps {
  filters: PlanFiltersType;
  onFiltersChange: (filters: PlanFiltersType) => void;
  filteredCount: number;
  totalCount: number;
}

export function PlanFilters({ 
  filters, 
  onFiltersChange,
  filteredCount,
  totalCount 
}: PlanFiltersProps) {
  const updateFilter = (key: keyof PlanFiltersType, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: "all",
      duration: "all",
      priceMin: "",
      priceMax: "",
    });
  };

  const hasActiveFilters = 
    filters.status !== "all" || 
    filters.duration !== "all" ||
    filters.priceMin !== "" ||
    filters.priceMax !== "";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={filters.status}
              onChange={(e) => updateFilter("status", e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Duration Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Duration
          </label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={filters.duration}
              onChange={(e) => updateFilter("duration", e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
            >
              <option value="all">All Durations</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        {/* Price Min */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Min Price (₦)
          </label>
          <input
            type="number"
            value={filters.priceMin}
            onChange={(e) => updateFilter("priceMin", e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Price Max */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Max Price (₦)
          </label>
          <input
            type="number"
            value={filters.priceMax}
            onChange={(e) => updateFilter("priceMax", e.target.value)}
            placeholder="∞"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Results Count & Clear Filters */}
      {hasActiveFilters && (
        <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-900 dark:text-white">{filteredCount}</span> of <span className="font-semibold">{totalCount}</span> plans
          </p>
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}