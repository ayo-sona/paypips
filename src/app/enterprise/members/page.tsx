"use client";

import { useState, useMemo } from "react";
import { MembersTable } from "../../../components/enterprise/MembersTable";
import { MemberFilters } from "../../../components/enterprise/MemberFilters";
import { UserPlus } from "lucide-react";
import { useMembers } from "../../../hooks/useMembers";

export default function MembersPage() {
  const [filters, setFilters] = useState({
    search: "",
    dateFrom: "",
    dateTo: "",
    plan: "all",
    status: "all" as "all" | "active" | "inactive" | "expired",
  });

  // Hook handles ALL business logic
  const { data: membersData, isLoading, error } = useMembers(filters.search);

  // Extract members array from response
  const members = useMemo(() => {
    if (!membersData) return [];
    // Handle both { data: [] } and [] formats
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Array.isArray(membersData) ? membersData : ((membersData as any).data || []);
  }, [membersData]);

  // UI-only: Filter members based on current filters
  const filteredMembers = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return members.filter((member: any) => {
      // Date range filter - by joined date
      if (filters.dateFrom) {
        const joinedDate = new Date(member.created_at || member.joinedDate);
        const fromDate = new Date(filters.dateFrom);
        if (joinedDate < fromDate) return false;
      }

      if (filters.dateTo) {
        const joinedDate = new Date(member.created_at || member.joinedDate);
        const toDate = new Date(filters.dateTo + 'T23:59:59');
        if (joinedDate > toDate) return false;
      }

      // Plan filter - by subscription plan
      if (filters.plan !== "all") {
        const memberPlanId = member.subscription_plan || member.plan_id || member.planId;
        if (memberPlanId !== filters.plan) return false;
      }

      // Status filter
      if (filters.status !== "all") {
        const memberStatus = member.status;
        if (filters.status === "active") {
          if (memberStatus !== "active") return false;
        } else if (filters.status === "inactive") {
          if (memberStatus !== "inactive") return false;
        } else if (filters.status === "expired") {
          if (memberStatus !== "expired") return false;
        }
      }

      return true;
    });
  }, [members, filters]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500 dark:text-gray-400">Loading members...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 dark:text-red-400 mb-4">
          Failed to load members
        </div>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Members Management
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage and monitor all member subscriptions
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          <UserPlus className="h-4 w-4" />
          Add Member
        </button>
      </div>

      {/* Filters */}
      <MemberFilters 
        filters={filters} 
        onFiltersChange={setFilters}
        filteredCount={filteredMembers.length}
        totalCount={members.length}
      />

      {/* Members Table */}
      <MembersTable members={filteredMembers} />
    </div>
  );
}