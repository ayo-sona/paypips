"use client";

import { Member } from "../../types/enterprise";
import Link from "next/link";
import { Mail, Phone, Calendar, MapPin, Heart, User } from "lucide-react";
import clsx from "clsx";

interface MembersTableProps {
  members: Member[];
}

export function MembersTable({ members }: MembersTableProps) {
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          No members found
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Try adjusting your filters to see more results
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
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
              // Safe access to nested properties
              const user = member.organization_user?.user;
              const firstName = user?.first_name || '';
              const lastName = user?.last_name || '';
              const fullName = `${firstName} ${lastName}`.trim() || 'Unknown User';
              const initials = firstName.charAt(0) || lastName.charAt(0) || 'M';
              const email = user?.email || 'N/A';
              const phone = user?.phone || member.emergency_contact_phone || 'N/A';
              const createdAt = member.created_at ? new Date(member.created_at) : null;
              const status = member.organization_user?.status || 'inactive';
              const role = member.organization_user?.role || 'MEMBER';
              const checkInCount = member.check_in_count || 0;
              
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
                          {initials.toUpperCase()}
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
                    <span
                      className={clsx(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                        role === "ADMIN" &&
                          "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
                        role === "STAFF" &&
                          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
                        role === "MEMBER" &&
                          "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                      )}
                    >
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
                    {user?.email_verified && (
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