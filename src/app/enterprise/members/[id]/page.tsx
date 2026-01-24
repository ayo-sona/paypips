"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Heart,
  UserPlus,
} from "lucide-react";
import { useMemberById } from "../../../../hooks/useMembers";
import { useCreateSubscription } from "../../../../hooks/useSubscriptions";
import { GrantAccessModal } from "../../../../components/enterprise/GrantAccessModal";
import clsx from "clsx";
import { toast } from "sonner"; // or your toast library

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;
  const [showGrantAccessModal, setShowGrantAccessModal] = useState(false);

  // Fetch member using hook
  const { data: member, isLoading, error } = useMemberById(memberId);

  // Grant access mutation
  const createSubscription = useCreateSubscription();

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 dark:text-red-400">
          Error loading member: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-blue-600 hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Member not found</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-blue-600 hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Use direct user object from API response
  const user = member.user;
  const firstName = user?.first_name || '';
  const lastName = user?.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Unknown User';
  const initials = (firstName.charAt(0) || lastName.charAt(0) || 'M').toUpperCase();
  const email = user?.email || 'N/A';
  const phone = user?.phone || member.emergency_contact_phone || 'N/A';
  const createdAt = member.created_at ? new Date(member.created_at) : null;
  const status = user?.status || 'inactive';
  const emailVerified = user?.email_verified || false;
  const lastLoginAt = user?.last_login_at ? new Date(user.last_login_at) : null;
  
  const role = 'MEMBER';

  const handleGrantAccess = async (data: any) => {
    try {
      await createSubscription.mutateAsync(data);
      toast.success('Access granted successfully!');
      setShowGrantAccessModal(false);
    } catch (error) {
      toast.error('Failed to grant access. Please try again.');
      console.error('Grant access error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      case "inactive":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
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
          {/* Grant Access Button */}
          <button
            onClick={() => setShowGrantAccessModal(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Grant Access
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Member Profile */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <div className="text-center">
                <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-2xl font-medium text-white">
                    {initials}
                  </span>
                </div>
                <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {fullName}
                </h2>
                <span
                  className={clsx(
                    "mt-2 inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize",
                    getStatusColor(status)
                  )}
                >
                  {status}
                </span>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                    {role}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3 text-sm">
                  <Mail className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                  <span className="text-gray-900 dark:text-gray-100 break-words">
                    {email}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-5 w-5 text-gray-400 shrink-0" />
                  <span className="text-gray-900 dark:text-gray-100">
                    {phone}
                  </span>
                </div>
                {createdAt && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-5 w-5 text-gray-400 shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Joined {formatDate(createdAt)}
                    </span>
                  </div>
                )}
                {member.address && (
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {member.address}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Check-ins
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-red-500" />
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {member.check_in_count || 0}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Email Status
                    </p>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {emailVerified ? (
                        <span className="text-green-600 dark:text-green-400">✓ Verified</span>
                      ) : (
                        <span className="text-yellow-600 dark:text-yellow-400">Unverified</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Member Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Info */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Personal Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Date of Birth
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {member.date_of_birth ? formatDate(new Date(member.date_of_birth)) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Member Since
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {createdAt ? formatDate(createdAt) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Emergency Contact
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {member.emergency_contact_name || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {member.emergency_contact_phone || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Last Login
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {lastLoginAt ? formatDate(lastLoginAt) : 'Never'}
                  </p>
                </div>
              </div>
            </div>

            {/* Subscriptions */}
            {member.subscriptions && member.subscriptions.length > 0 && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Subscriptions
                </h3>
                <div className="space-y-4">
                  {member.subscriptions.map((subscription) => (
                    <div
                      key={subscription.id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {subscription.plan.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {subscription.plan.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {formatDate(new Date(subscription.started_at))} - {formatDate(new Date(subscription.expires_at))}
                        </p>
                      </div>
                      <div className="ml-4">
                        <span
                          className={clsx(
                            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                            subscription.status === "active" &&
                              "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
                            subscription.status === "expired" &&
                              "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
                            subscription.status === "canceled" &&
                              "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                          )}
                        >
                          {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medical Notes */}
            {member.medical_notes && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Medical Notes
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {member.medical_notes}
                </p>
              </div>
            )}

            {/* Metadata */}
            {member.metadata && Object.keys(member.metadata).length > 0 && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Additional Information
                </h3>
                <div className="space-y-2">
                  {Object.entries(member.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400 capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grant Access Modal */}
      {showGrantAccessModal && (
        <GrantAccessModal
          member={member}
          onClose={() => setShowGrantAccessModal(false)}
          onGrant={handleGrantAccess}
        />
      )}
    </>
  );
}