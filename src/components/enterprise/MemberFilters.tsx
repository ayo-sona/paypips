"use client";

import { Calendar, Filter, X } from "lucide-react";
import { MOCK_PLANS } from "../../lib/mockData/enterpriseMockdata";
import { SearchBar } from "./MemberSearchBar";

interface MemberFiltersType {
  search: string;
  dateFrom: string;
  dateTo: string;
  plan: string;
  status: "all" | "active" | "inactive" | "expired";
}

interface MemberFiltersProps {
  filters: MemberFiltersType;
  onFiltersChange: (filters: MemberFiltersType) => void;
  filteredCount: number;
  totalCount: number;
  isLoading?: boolean; // ⭐ NEW: Accept loading state
}

export function MemberFilters({ 
  filters, 
  onFiltersChange,
  filteredCount,
  totalCount,
  isLoading = false // ⭐ NEW: Default to false
}: MemberFiltersProps) {
  const updateFilter = (key: keyof MemberFiltersType, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      dateFrom: "",
      dateTo: "",
      plan: "all",
      status: "all",
    });
  };

  const hasActiveFilters = 
    filters.search || 
    filters.dateFrom || 
    filters.dateTo || 
    filters.plan !== "all" ||
    filters.status !== "all";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      {/* ⭐ Search Bar Component */}
      <SearchBar 
        value={filters.search}
        onChange={(value) => updateFilter("search", value)}
        placeholder="Search members by name or email..."
        isLoading={isLoading}
      />

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date From */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Joined From
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => updateFilter("dateFrom", e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Date To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Joined To
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => updateFilter("dateTo", e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Plan Filter - Dynamically populated from enterprise's plans */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Subscription Plan
          </label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={filters.plan}
              onChange={(e) => updateFilter("plan", e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
            >
              <option value="all">All Plans</option>
              {MOCK_PLANS.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} (₦{plan.price.toLocaleString()}/{plan.duration})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Member Status
          </label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={filters.status}
              onChange={(e) => updateFilter("status", e.target.value as MemberFiltersType["status"])}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Status Descriptions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="font-semibold text-green-700 dark:text-green-400">Active:</span>
            <span className="text-gray-700 dark:text-gray-300 ml-1">
              Currently subscribed
            </span>
          </div>
          <div>
            <span className="font-semibold text-yellow-700 dark:text-yellow-400">Inactive:</span>
            <span className="text-gray-700 dark:text-gray-300 ml-1">
              Self-signup, not renewed
            </span>
          </div>
          <div>
            <span className="font-semibold text-red-700 dark:text-red-400">Expired:</span>
            <span className="text-gray-700 dark:text-gray-300 ml-1">
              Manual add, not renewed
            </span>
          </div>
        </div>
      </div>

      {/* Results Count & Clear Filters */}
      {hasActiveFilters && (
        <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-900 dark:text-white">{filteredCount}</span> of <span className="font-semibold">{totalCount}</span> members
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