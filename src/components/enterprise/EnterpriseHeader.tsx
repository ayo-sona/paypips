"use client";

import { useState } from "react";
import { Button, Spinner } from "@heroui/react";
import { Bell, LogOut } from "lucide-react";
import { ThemeToggle } from "../layout/themeToggle";
import { NotificationPanel } from "./EnterpriseNotificationPanel";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { deleteCookie } from "cookies-next/client";

export function EnterpriseHeader() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
  const unreadCount = 3;

  const router = useRouter();
  const handleLogout = async () => {
    try {
      setLoading(true);
      // Call your logout API
      await apiClient.post("/auth/logout");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      // Clear local storage
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }

      // Delete all cookies
      deleteCookie("access_token");
      deleteCookie("refresh_token");
      setLoading(false);

      // Redirect to login
      router.push("/auth/login");
      router.refresh();
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6">
      {/* Search */}
      <div className="flex flex-1 items-center max-w-md"></div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative">
          <Button
            onPress={() => setShowNotifications(!showNotifications)}
            className="relative cursor-pointer rounded-lg p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                {unreadCount}
              </span>
            )}
          </Button>

          {showNotifications && (
            <NotificationPanel onClose={() => setShowNotifications(false)} />
          )}
        </div>
        <Button
          onPress={handleLogout}
          className="flex cursor-pointer items-center gap-2 rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-100"
          title="Logout"
        >
          {loading ? (
            <Spinner size="sm" color="danger" />
          ) : (
            <LogOut className="h-5 w-5" />
          )}
        </Button>
      </div>
    </header>
  );
}
