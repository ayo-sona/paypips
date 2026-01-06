'use client';

import { X, DollarSign, AlertTriangle, UserPlus } from 'lucide-react';
import Link from 'next/link';

interface NotificationPanelProps {
  onClose: () => void;
}

const notifications = [
  {
    id: '1',
    type: 'payment',
    title: 'New Payment Received',
    message: 'Chidi Okonkwo paid ₦10,000 for Pro Plan',
    time: '5 minutes ago',
    read: false,
    link: '/Enterprise/members/mem_001',
    icon: DollarSign,
    color: 'text-green-600 bg-green-100 dark:bg-green-900/20',
  },
  {
    id: '2',
    type: 'expiring',
    title: 'Subscription Expiring Soon',
    message: 'Amara Nwosu subscription expires in 3 days',
    time: '1 hour ago',
    read: false,
    link: '/Enterprise/members/mem_002',
    icon: AlertTriangle,
    color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
  },
  {
    id: '3',
    type: 'new_member',
    title: 'New Member Joined',
    message: 'Ibrahim Musa joined with Starter Plan',
    time: '3 hours ago',
    read: false,
    link: '/Enterprise/members/mem_007',
    icon: UserPlus,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
  },
  {
    id: '4',
    type: 'expired',
    title: 'Subscription Expired',
    message: 'Tunde Bakare subscription has expired',
    time: '1 day ago',
    read: true,
    link: '/Enterprise/members/mem_005',
    icon: AlertTriangle,
    color: 'text-red-600 bg-red-100 dark:bg-red-900/20',
  },
];

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute right-0 top-12 z-50 w-96 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Notifications
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="max-h-[32rem] overflow-y-auto">
          {notifications.map((notification) => {
            const Icon = notification.icon;
            
            return (
              <Link
                key={notification.id}
                href={notification.link}
                className={`flex gap-3 border-b border-gray-100 dark:border-gray-700 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                  !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                }`}
                onClick={onClose}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${notification.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {notification.message}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                    {notification.time}
                  </p>
                </div>
                {!notification.read && (
                  <div className="shrink-0">
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-600" />
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-3">
          <button className="w-full rounded-lg py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
            View All Notifications
          </button>
        </div>
      </div>
    </>
  );
}