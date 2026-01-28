"use client";

import { Users, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { useAnalyticsOverview } from "../../hooks/useAnalytics";
import { useTeamMembers } from "../../hooks/useOrganisations";
import { useMemo } from "react";

export function AnalyticsCards() {
  // Hooks handle ALL business logic
  const {
    data: analytics,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useAnalyticsOverview({
    period: "custom",
    startDate: new Date("2026-01-01").toISOString(),
    endDate: new Date("2026-01-31").toISOString(),
  });
  // console.log("analytics", analytics);
  const { data: teamMembers, isLoading: teamLoading } = useTeamMembers();

  const isLoading = analyticsLoading || teamLoading;

  // Calculate active/inactive from team data
  const memberStats = useMemo(() => {
    if (!teamMembers) {
      return { active: 0, inactive: 0, total: 0 };
    }

    const active = teamMembers.filter((m) => m.status === "active").length;
    const inactive = teamMembers.filter((m) => m.status === "inactive").length;

    return {
      active,
      inactive,
      total: teamMembers.length,
    };
  }, [teamMembers]);

  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-40 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (analyticsError || !analytics) {
    return (
      <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
        <p className="text-sm text-red-600 dark:text-red-400">
          Unable to load analytics. The analytics API endpoint may not be
          implemented yet.
        </p>
      </div>
    );
  }

  // Smart fallbacks with priority order
  const activeMembers =
    analytics.members.active_members ?? // Backend provides this (future)
    memberStats.active ?? // Calculate from team (current)
    analytics.subscriptions.active_subscriptions ?? // Last resort
    0;

  const inactiveMembers =
    analytics.members.inactive_members ?? // Backend provides this (future)
    memberStats.inactive ?? // Calculate from team (current)
    Math.max(0, analytics.members.total_members - activeMembers) ?? // Calculate
    0;

  // Use team count as source of truth for total
  const totalMembers =
    memberStats.total || analytics.members.total_members || 0;

  // UI-only: Format stats from API data
  const stats = [
    {
      name: "Total Members",
      value: totalMembers.toString(),
      change: `+${analytics.members.new_members || 0} this period`,
      changeType: "positive" as const,
      icon: Users,
      color: "bg-blue-500",
      subStats: [
        { label: "Active", value: activeMembers },
        { label: "Inactive", value: inactiveMembers },
      ],
    },
    {
      name: "Monthly Revenue",
      value: `₦${((analytics.revenue.period_revenue || 0) / 1000).toFixed(1)}K`,
      change: `${analytics.revenue.growth_rate >= 0 ? "+" : ""}${(analytics.revenue.growth_rate || 0).toFixed(1)}% from last period`,
      changeType:
        (analytics.revenue.growth_rate || 0) >= 0
          ? ("positive" as const)
          : ("negative" as const),
      icon: DollarSign,
      color: "bg-green-500",
      subStats: [
        {
          label: "Payments",
          value: analytics.payments.successful_payments || 0,
        },
        {
          label: "Total",
          value: `₦${(analytics.revenue.total_revenue || 0).toLocaleString()}`,
        },
      ],
    },
    {
      name: "MRR",
      value: `₦${((analytics.mrr.current_mrr || 0) / 1000).toFixed(1)}K`,
      change: `${analytics.mrr.growth_rate >= 0 ? "+" : ""}${(analytics.mrr.growth_rate || 0).toFixed(1)}% growth`,
      changeType:
        (analytics.mrr.growth_rate || 0) >= 0
          ? ("positive" as const)
          : ("negative" as const),
      icon: TrendingUp,
      color: "bg-purple-500",
      subStats: [
        {
          label: "Active Subs",
          value: analytics.subscriptions.active_subscriptions || 0,
        },
      ],
    },
    {
      name: "Needs Attention",
      value: inactiveMembers.toString(),
      change: `${inactiveMembers} inactive`,
      changeType: "warning" as const,
      icon: AlertCircle,
      color: "bg-orange-500",
      subStats: [],
    },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.name}
            className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.name}
                  </p>
                  <p
                    className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100"
                    suppressHydrationWarning
                  >
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} rounded-lg p-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>

              <div className="mt-4">
                <div
                  className={`inline-flex items-baseline gap-1 text-sm font-medium ${
                    stat.changeType === "positive"
                      ? "text-green-600 dark:text-green-400"
                      : stat.changeType === "negative"
                        ? "text-red-600 dark:text-red-400"
                        : "text-orange-600 dark:text-orange-400"
                  }`}
                >
                  {stat.change}
                </div>

                {stat.subStats.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-4">
                      {stat.subStats.map((subStat) => (
                        <div key={subStat.label} className="text-xs">
                          <span className="text-gray-500 dark:text-gray-400">
                            {subStat.label}:
                          </span>{" "}
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {subStat.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
