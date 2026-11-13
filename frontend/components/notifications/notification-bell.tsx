"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/api/notifications";
import { queryKeys } from "@/lib/query-keys";
import { formatDateTime } from "@/lib/format";
import type { AppNotification } from "@/types/notification";

export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: queryKeys.notifications.all(),
    queryFn: () => getNotifications(1, 10),
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
    },
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const notifications = data?.items || [];
  const unreadCount = data?.unreadCount || 0;

  const handleNotificationClick = (item: AppNotification) => {
    if (!item.readAt) {
      markReadMutation.mutate(item._id);
    }
    setIsOpen(false);

    const targetLink =
      item.data?.link ||
      (item.data?.bookingId ? `/bookings/${item.data.bookingId}` : null) ||
      (item.data?.issueId ? `/issues/${item.data.issueId}` : null) ||
      "/notifications";

    router.push(targetLink);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative rounded-full p-2 text-ink-muted hover:text-ink hover:bg-paper-light focus:outline-none focus:ring-2 focus:ring-brand transition-colors"
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Desktop Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg border border-line bg-paper-card shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3 bg-paper-light">
            <span className="font-serif text-sm font-bold text-ink">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
                className="text-[11px] font-medium text-brand hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-line">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-ink-muted">
                No notifications right now.
              </div>
            ) : (
              notifications.map((item) => {
                const isUnread = !item.readAt;
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => handleNotificationClick(item)}
                    className={`w-full text-left p-3.5 transition-colors hover:bg-paper-light flex items-start gap-2.5 ${
                      isUnread ? "bg-brand/5" : ""
                    }`}
                  >
                    <div className="mt-1 h-2 w-2 rounded-full shrink-0">
                      {isUnread && <div className="h-2 w-2 rounded-full bg-brand" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-xs ${isUnread ? "font-semibold text-ink" : "text-ink"}`}>
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted line-clamp-2 leading-relaxed">
                        {item.body}
                      </p>
                      <span className="mt-1 block text-[10px] text-ink-muted">
                        {formatDateTime(item.createdAt)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t border-line bg-paper-light p-2 text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-brand hover:underline block py-1"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

