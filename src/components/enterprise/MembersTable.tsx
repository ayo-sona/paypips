"use client";

import { Member } from "../../types/enterprise";
import Link from "next/link";
import { Mail, Phone, Calendar, MapPin, Heart, User, SearchX } from "lucide-react";
import clsx from "clsx";

interface MembersTableProps {
  members: Member[];
  isSearching?: boolean;
  isLoading?: boolean;
}

export function MembersTable({ members, isSearching = false, isLoading = false }: MembersTableProps) {
  // Only show empty state when NOT loading and no results
  if (members.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mb-4">
          {isSearching ? (
            <SearchX className="w-10 h-10 text-blue-500 dark:text-blue-400" />
          ) : (
            <User className="w-10 h-10 text-gray-400" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {isSearching ? "Oops! No matches found" : "No members yet"}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm text-center max-w-sm">
          {isSearching 
            ? "Hmm... looks like that name is playing hide and seek 🕵️ Try checking the spelling or search for something else!"
            : "Your member list is empty. Start by adding your first member!"}
        </p>
      </div>
    );
  }

  // Show initial loading state (only on very first load when there's no data)
  if (members.length === 0 && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Loading members...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Subtle loading overlay when refreshing data */}
      {isLoading && members.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-2">
          <div className="flex items-center justify-center gap-2 text-sm text-blue-700 dark:text-blue-400">
            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Updating results...</span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Check-ins
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {members.map((member) => {
              // ⭐ UPDATED: Use direct user object from API response
              const user = member.user;
              const firstName = user?.first_name || '';
              const lastName = user?.last_name || '';
              const fullName = `${firstName} ${lastName}`.trim() || 'Unknown User';
              const initials = (firstName.charAt(0) || lastName.charAt(0) || 'M').toUpperCase();
              const email = user?.email || 'N/A';
              const phone = user?.phone || member.emergency_contact_phone || 'N/A';
              const createdAt = member.created_at ? new Date(member.created_at) : null;
              const status = user?.status || 'inactive';
              const checkInCount = member.check_in_count || 0;
              const emailVerified = user?.email_verified || false;
              
              // All users from /members endpoint are MEMBER role
              const role = 'MEMBER';
              
              return (
                <tr
                  key={member.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  {/* Member Info */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {initials}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {fullName}
                        </div>
                        {createdAt && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Joined {createdAt.toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
                        <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{phone}</span>
                      </div>
                      {member.address && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                          <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{member.address}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                      {role}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={clsx(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                        status === "active" &&
                          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
                        status === "inactive" &&
                          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      )}
                    >
                      <span
                        className={clsx(
                          "w-1.5 h-1.5 rounded-full",
                          status === "active" && "bg-green-500",
                          status === "inactive" && "bg-yellow-500"
                        )}
                      />
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                    {emailVerified && (
                      <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                        ✓ Email verified
                      </div>
                    )}
                  </td>

                  {/* Check-ins */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {checkInCount}
                      </span>
                    </div>
                  </td>

                  {/* Joined Date */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {createdAt && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {createdAt.toLocaleDateString()}
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/enterprise/members/${member.id}`}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}