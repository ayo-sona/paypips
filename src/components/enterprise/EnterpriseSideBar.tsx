"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  CreditCard,
  Send,
  FileDown,
  Settings,
} from "lucide-react";
import clsx from "clsx";

const navigation = [
  { name: "Dashboard", href: "/enterprise/dashboard", icon: LayoutDashboard },
  { name: "Members", href: "/enterprise/members", icon: Users },
  { name: "Subscription Plans", href: "/enterprise/plans", icon: Package },
  { name: "Payments", href: "/enterprise/payments", icon: CreditCard },
  { name: "Reminders", href: "/enterprise/reminders", icon: Send },
  { name: "Reports", href: "/enterprise/reports", icon: FileDown },
  { name: "Settings", href: "/enterprise/settings", icon: Settings },
];

export function EnterpriseSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex w-64 flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">
          Willow Enterprise
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                  : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              WE
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              Willow Enterprise
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              enterprise@willow.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
