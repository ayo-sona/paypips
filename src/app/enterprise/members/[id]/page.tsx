"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Award,
} from "lucide-react";
import {
  MOCK_MEMBERS,
  MOCK_PAYMENT_HISTORY,
} from "../../../../lib/mockData/members";
import { Member } from "../../../../types/member";
import { PlanId } from "../../../../types/subscription";
import { GrantAccessModal } from "../../../../components/enterprise/GrantAccessModal";
import clsx from "clsx";

// Store for updated members (simulates database)
const updatedMembersCache = new Map<string, Member>();

// Fetch member with auto-expire logic
const fetchMember = async (memberId: string): Promise<Member | undefined> => {
  // Check if we have an updated version in cache first
  if (updatedMembersCache.has(memberId)) {
    console.log('Loading member from cache:', memberId);
    return updatedMembersCache.get(memberId);
  }
  
  // In production, this would be an API call
  let member = MOCK_MEMBERS.find((m) => m.id === memberId);
  
  if (!member) return undefined;
  
  // Check if expired based on current date
  const today = new Date();
  const expiryDate = new Date(member.subscriptionExpiryDate);
  
  // Auto-update status to expired if past expiry date
  if (expiryDate < today && member.status === 'active') {
    member = { ...member, status: 'expired' };
  }
  
  return member;
};

interface GrantAccessData {
  planId: string;
  planName: string;
  duration: number;
  durationType: 'days' | 'months';
  expiryDate: string;
  reason: string;
  applyMode: 'override' | 'queue';
}

// Grant access mutation
const grantAccess = async ({ memberId, data }: { memberId: string; data: GrantAccessData }): Promise<Member> => {
  console.log('grantAccess called:', { memberId, data });
  
  // TODO: Replace with actual API call
  const member = MOCK_MEMBERS.find((m) => m.id === memberId);
  if (!member) {
    console.error('Member not found:', memberId);
    throw new Error('Member not found');
  }
  
  console.log('Found member:', member);
  
  // Check if member is expired by date
  const isExpiredByDate = new Date(member.subscriptionExpiryDate) < new Date();
  const shouldUseOverride = data.applyMode === 'override' || isExpiredByDate;
  
  // Calculate new expiry date
  let startDate = new Date();
  if (!shouldUseOverride && member.subscriptionExpiryDate) {
    // Queue mode: start from current expiry date (only if not expired)
    startDate = new Date(member.subscriptionExpiryDate);
  }
  // Otherwise: start from today (override mode or expired member)
  
  const expiryDate = new Date(startDate);
  if (data.durationType === 'days') {
    expiryDate.setDate(expiryDate.getDate() + data.duration);
  } else {
    expiryDate.setMonth(expiryDate.getMonth() + data.duration);
  }
  
  console.log('Calculated dates:', {
    shouldUseOverride,
    isExpiredByDate,
    startDate: startDate.toISOString(),
    expiryDate: expiryDate.toISOString(),
  });
  
  // Return updated member
  const updatedMember = {
    ...member,
    subscriptionPlan: data.planId as PlanId,
    status: 'active' as const,
    subscriptionStartDate: shouldUseOverride ? new Date().toISOString() : member.subscriptionStartDate,
    subscriptionExpiryDate: expiryDate.toISOString(),
  };
  
  console.log('Returning updated member:', updatedMember);
  
  // Save to cache so fetchMember can find it
  updatedMembersCache.set(memberId, updatedMember);
  
  return updatedMember;
};

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showGrantAccess, setShowGrantAccess] = useState(false);

  // Fetch member with auto-expire logic
  const { data: member, isLoading } = useQuery({
    queryKey: ['member', params.id],
    queryFn: () => fetchMember(params.id as string),
  });

  // Grant access mutation
  const grantAccessMutation = useMutation({
    mutationFn: grantAccess,
    onSuccess: (updatedMember) => {
      // Update the member in cache
      queryClient.setQueryData(['member', params.id], updatedMember);
      
      // Invalidate member query to force refetch with fresh dates
      queryClient.invalidateQueries({ queryKey: ['member', params.id] });
      
      // Also invalidate members list to update everywhere
      queryClient.invalidateQueries({ queryKey: ['members'] });
      
      // Invalidate plans to update member count
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });

  const payments = MOCK_PAYMENT_HISTORY.filter((p) => p.memberId === params.id);

  // Fetch plans from TanStack Query
  const { data: plans = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ['plans'],
    queryFn: async () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('enterprise_plans');
        if (stored) {
          return JSON.parse(stored);
        }
      }
      return [];
    },
  });

  // Calculate total paid from payment history (only successful payments)
  const totalPaid = payments
    .filter(p => p.status === 'success')
    .reduce((sum, p) => sum + p.amount, 0);

  // Get plan name from plan ID
  const memberPlan = plans.find(p => p.id === member?.subscriptionPlan);
  const planDisplayName = memberPlan?.name || member?.subscriptionPlan || 'Unknown Plan';

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Member not found</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      case "inactive":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400";
      case "expired":
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleGrantAccess = (data: GrantAccessData) => {
    console.log('handleGrantAccess called with:', data);
    console.log('Member ID:', member.id);
    
    grantAccessMutation.mutate(
      { memberId: member.id, data },
      {
        onSuccess: (updatedMember) => {
          console.log('Grant access successful:', updatedMember);
          setShowGrantAccess(false);
        },
        onError: (error) => {
          console.error('Grant access failed:', error);
          alert('Failed to grant access: ' + error.message);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Member Details
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            View and manage member information
          </p>
        </div>
        <button
          onClick={() => setShowGrantAccess(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Grant Access
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Member Profile */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <div className="text-center">
              <div className="mx-auto h-24 w-24 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <span className="text-2xl font-medium text-blue-600 dark:text-blue-400">
                  {member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
                {member.name}
              </h2>
              <span
                className={clsx(
                  "mt-2 inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize",
                  getStatusColor(member.status)
                )}
              >
                {member.status}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900 dark:text-gray-100">
                  {member.email}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900 dark:text-gray-100">
                  {member.phone}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  Joined {formatDate(member.joinedDate)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Award className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900 dark:text-gray-100">
                  {planDisplayName}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Total Paid
                  </p>
                  <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100" suppressHydrationWarning>
                    ₦{totalPaid.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Payments
                  </p>
                  <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {payments.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription & Payment History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subscription Info */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Subscription Information
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Start Date
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100" suppressHydrationWarning>
                  {formatDate(member.subscriptionStartDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Expiry Date
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100" suppressHydrationWarning>
                  {formatDate(member.subscriptionExpiryDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Billing Cycle
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                  {member.billingCycle || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Payment Gateway
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                  {member.gateway || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Payment History
            </h3>
            {payments.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No payment history available
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Date
                      </th>
                      <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Description
                      </th>
                      <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Method
                      </th>
                      <th className="pb-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Amount
                      </th>
                      <th className="pb-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(payment.date)}
                        </td>
                        <td className="py-3 text-sm text-gray-900 dark:text-gray-100">
                          {payment.description}
                        </td>
                        <td className="py-3 text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {payment.method.replace("_", " ")}
                        </td>
                        <td className="py-3 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                          ₦{payment.amount.toLocaleString()}
                        </td>
                        <td className="py-3 text-center">
                          <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/20 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-400 capitalize">
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grant Access Modal */}
      {showGrantAccess && (
        <GrantAccessModal
          member={member}
          onClose={() => setShowGrantAccess(false)}
          onGrant={handleGrantAccess}
        />
      )}
    </div>
  );
}