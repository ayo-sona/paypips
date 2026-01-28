"use client";

import { Payment } from "../../types/enterprise";
import Link from "next/link";
import { CreditCard, Wallet, Smartphone, CheckCircle } from "lucide-react";
import clsx from "clsx";

interface PaymentsTableProps {
  payments: Payment[];
}

export function PaymentsTable({ payments }: PaymentsTableProps) {
  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <CreditCard className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          No payments found
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Try adjusting your filters to see more results
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Member
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Plan
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Provider
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Reference
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {payments.map((payment) => {
            return (
              <tr
                key={payment.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                {/* Member Name - Clickable */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/enterprise/members/${payment.payer_user?.id}`}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
                  >
                    {payment.payer_user?.first_name +
                      " " +
                      payment.payer_user?.last_name}
                  </Link>
                </td>

                {/* Email */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {payment.payer_user?.email || "N/A"}
                  </div>
                </td>

                {/* Amount */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    ₦{payment.amount.toLocaleString()}
                  </div>
                </td>

                {/* Plan */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {payment.plan_name}
                  </div>
                </td>

                {/* Payment Status */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={clsx(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                      payment.status === "success"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : payment.status === "pending"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : payment.status === "failed"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400",
                    )}
                  >
                    <CheckCircle className="w-3 h-3" />
                    {payment.status.charAt(0).toUpperCase() +
                      payment.status.slice(1)}
                  </span>
                </td>

                {/* Date */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {new Date(payment.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(payment.created_at).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </td>

                {/* Payment Provider */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-900 dark:text-gray-100 capitalize">
                      {payment.provider}
                    </span>
                  </div>
                </td>

                {/* Provider Reference */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={clsx(
                      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
                    )}
                  >
                    {payment.provider_reference}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
