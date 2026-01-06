'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { ThemeToggle } from '../layout/themeToggle';
import { NotificationPanel } from './EnterpriseNotificationPanel';

export function EnterpriseHeader() {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = 3;

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6">
      {/* Search */}
      <div className="flex flex-1 items-center max-w-md">

      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <ThemeToggle />
        
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <NotificationPanel onClose={() => setShowNotifications(false)} />
          )}
        </div>
      </div>
    </header>
  );
}