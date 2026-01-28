"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  DollarSign,
  TrendingUp,
  CreditCard,
  Users,
  AlertCircle,
} from "lucide-react";
import { PaymentsTable } from "../../../components/enterprise/PaymentsTable";
import { PaymentFilters } from "../../../components/enterprise/PaymentFilters";
import {
  ManualPaymentModal,
  ManualPaymentData,
} from "../../../components/enterprise/ManualPaymentModal";
import {
  usePayments,
  usePaymentStats,
  useInitializePayment,
} from "../../../hooks/usePayments";
import { mapApiPaymentsToUiPayments } from "../../../utils/paymentMapper";

export default function PaymentsPage() {
  const [showManualPaymentModal, setShowManualPaymentModal] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("success");

  // Hooks handle ALL business logic
  const {
    data: paymentsResponse,
    isLoading,
    error,
    refetch,
  } = usePayments(1, 10, selectedStatus);
  // console.log("paymentsResponse", paymentsResponse);
  // console.log("sample payment", paymentsResponse?.data[0]);
  const { data: stats } = usePaymentStats();
  // console.log("stats", stats);
  const createPayment = useInitializePayment();

  // Transform API payments to match PaymentsTable expected format
  const payments = useMemo(() => {
    const apiPayments = paymentsResponse?.data || [];
    return mapApiPaymentsToUiPayments(apiPayments);
  }, [paymentsResponse?.data]);

  // UI-only: Apply filters
  const filteredPayments = payments.filter((payment) => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        payment.payer_user.first_name?.toLowerCase().includes(search) ||
        payment.payer_user.last_name?.toLowerCase().includes(search) ||
        payment.payer_user.email?.toLowerCase().includes(search) ||
        new Date(payment.created_at).toLocaleDateString().includes(search);
      if (!matchesSearch) return false;
    }

    // Date filters
    if (dateFrom && new Date(payment.created_at) < new Date(dateFrom))
      return false;
    if (dateTo && new Date(payment.created_at) > new Date(dateTo + "T23:59:59"))
      return false;

    // Gateway filter
    if (selectedSource === "all") return true;
    if (selectedSource === "paystack" && payment.provider !== "paystack")
      return false;
    if (selectedSource === "kora" && payment.provider !== "kora") return false;
    if (selectedSource === "manual" && payment.provider !== "manual")
      return false;

    return true;
  });
  // console.log("filteredPayments", filteredPayments);

  // UI-only: Calculate stats from fetched data or use backend stats
  const displayStats = stats
    ? [
        {
          title: "Total Revenue",
          value: `₦${(stats.total_revenue / 1000).toFixed(1)}K`,
          icon: DollarSign,
          color: "bg-green-500",
          subtext: "All time",
        },
        {
          title: "Total Expenses",
          value: `₦${(stats.total_expenses / 1000).toFixed(1)}K`,
          icon: TrendingUp,
          color: "bg-blue-500",
          subtext: "All time",
        },
        {
          title: "Total Profit",
          value: `₦${((stats.total_revenue - stats.total_expenses) / 1000).toFixed(1)}K`,
          icon: CreditCard,
          color: "bg-purple-500",
          subtext: "All time",
        },
        {
          title: "Successful Payments",
          value: stats.successful_payments,
          icon: Users,
          color: "bg-green-500",
          subtext: "All time",
        },
        {
          title: "Failed Payments",
          value: stats.failed_payments,
          icon: Users,
          color: "bg-red-500",
          subtext: "All time",
        },
        {
          title: "Pending Payments",
          value: stats.pending_payments,
          icon: Users,
          color: "bg-yellow-500",
          subtext: "All time",
        },
      ]
    : [];

  // Event handlers - just call hooks
  // const handleLogManualPayment = async (data: ManualPaymentData) => {
  //   try {
  //     await createPayment.mutateAsync({
  //       memberId: data.memberId,
  //       amount: data.amount,
  //       currency: data.currency,
  //       provider: data.provider,
  //       provider_reference: data.provider_reference,
  //       description: data.description,
  //       paidAt: data.paidAt,
  //     });
  //     setShowManualPaymentModal(false);
  //     console.log("Payment logged successfully");
  //   } catch (error) {
  //     console.error("Failed to log payment:", error);
  //     alert("Failed to log payment. Please try again.");
  //   }
  // };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500 dark:text-gray-400">
          Loading payments...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-6 max-w-md">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                Failed to Load Payments
              </h3>
              <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                Unable to fetch payment data from the server. This could be
                because:
              </p>
              <ul className="mt-2 text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
                <li>The payments API endpoint is not yet implemented</li>
                <li>You don&apos;t have permission to view payments</li>
                <li>There&apos;s a network connection issue</li>
              </ul>
              <button
                onClick={() => refetch()}
                className="mt-4 w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Payment History
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View all payments and manually log transactions
          </p>
        </div>
        <button
          onClick={() => setShowManualPaymentModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Log Payment
        </button>
      </div>

      {/* Stats Grid */}
      {displayStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayStats.map((stat) => (
            <div
              key={stat.title}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {stat.title}
                  </p>
                  <p
                    className="text-2xl font-bold text-gray-900 dark:text-white mt-2"
                    suppressHydrationWarning
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {stat.subtext}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <PaymentFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        selectedSource={selectedSource}
        setSelectedSource={setSelectedSource}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        filteredCount={filteredPayments.length}
      />

      {/* Payments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {payments.length === 0
                ? "No payments yet. Log your first payment to get started."
                : "No payments match your current filters."}
            </p>
          </div>
        ) : (
          <PaymentsTable payments={filteredPayments} />
        )}
      </div>

      {/* Manual Payment Modal */}
      {/* <ManualPaymentModal
        isOpen={showManualPaymentModal}
        onClose={() => setShowManualPaymentModal(false)}
        onSave={handleLogManualPayment}
      /> */}
    </div>
  );
}
