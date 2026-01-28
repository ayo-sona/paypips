"use client";

import { AnalyticsCards } from "../../../components/enterprise/AnalyticsCards";
import { MembersGrowthChart } from "../../../components/enterprise/MembersGrowthChart";
import { RevenueChart } from "../../../components/enterprise/RevenueChart";
import { PlanDistributionChart } from "../../../components/enterprise/PlanDistributionChart";
import { RecentMembersTable } from "../../../components/enterprise/RecentMembersTable";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import apiClient from "@/lib/apiClient";

export default function EnterpriseDashboardPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");

  useEffect(() => {
    if (reference) {
      verifyPayment(reference);
    }
  }, [reference]);

  const verifyPayment = async (ref: string) => {
    try {
      const { data } = await apiClient.get(`/payments/verify/${ref}`);

      if (data.data.status === "success") {
        // Show success message
        alert("Payment successful! Your subscription is now active.");

        // Update organization subscription status
        await apiClient.patch(`/subscriptions/organizations/status`, {
          status: "active",
        });
      }
    } catch (error) {
      console.error("Verification error:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Welcome back! Here&apos;s an overview of your membership business.
        </p>
      </div>

      {/* Analytics Cards */}
      <AnalyticsCards />

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MembersGrowthChart />
        <RevenueChart />
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentMembersTable />
        </div>
        <div>
          <PlanDistributionChart />
        </div>
      </div>
    </div>
  );
}
