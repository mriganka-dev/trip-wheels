"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/notifications";
import { formatNotification } from "@/lib/notification-format";
import { formatDateTime } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import type { NotificationItem } from "@/types/notification";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: queryKeys.notifications.list({ limit: 8 }),
    queryFn: () => getNotifications({ limit: 8 }),
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const unreadCount = data?.unreadCount ?? 0;
  const notifications = data?.items ?? [];

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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

  const handleItemClick = (item: NotificationItem, href: string) => {
    if (!item.readAt) {
      markReadMutation.mutate(item._id);
    }
    setIsOpen(false);
    router.push(href);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* On mobile: direct link; on desktop: opens dropdown */}
      <button
        type="button"
        onClick={() => {
          if (window.innerWidth < 768) {
            router.push("/notifications");
          } else {
            setIsOpen((prev) => !prev);
          }
        }}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
        className="relative flex items-center justify-center p-2 rounded-md text-(--ink-soft) hover:text-(--ink) hover:bg-(--paper) transition-colors min-h-[44px] min-w-[44px] focus-visible:outline-2 focus-visible:outline-(--brand) cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-(--brand) text-[10px] font-bold text-white ring-2 ring-(--surface)">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Desktop Dropdown */}
      {isOpen && (
        <div className="hidden md:block absolute right-0 mt-2 w-96 rounded-md border border-(--line) bg-(--surface) shadow-lg z-50">
          <div className="flex items-center justify-between p-3 border-b border-(--line)">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-(--ink)">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-xs font-medium text-(--brand) bg-(--brand)/10 px-2 py-0.5 rounded">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
                className="text-xs font-medium text-(--brand) hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-(--line)">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-(--ink-soft)">
                No notifications right now.
              </div>
            ) : (
              notifications.map((item) => {
                const formatted = formatNotification(item);
                const isUnread = !item.readAt;

                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => handleItemClick(item, formatted.href)}
                    className={`w-full text-left p-3 hover:bg-(--surface-soft) transition-colors flex items-start gap-3 cursor-pointer ${
                      isUnread ? "bg-(--brand)/5" : ""
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                        isUnread ? "bg-(--brand)" : "bg-transparent"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs ${
                          isUnread
                            ? "font-semibold text-(--ink)"
                            : "font-medium text-(--ink)"
                        }`}
                      >
                        {formatted.title}
                      </p>
                      {formatted.body && (
                        <p className="text-xs text-(--ink-soft) line-clamp-2 mt-0.5">
                          {formatted.body}
                        </p>
                      )}
                      <time className="text-[10px] text-(--ink-soft) block mt-1">
                        {formatDateTime(item.createdAt)}
                      </time>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="p-2.5 border-t border-(--line) bg-(--surface-soft) text-center rounded-b-md">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-(--brand) hover:underline inline-flex items-center gap-1"
            >
              View all notifications
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
