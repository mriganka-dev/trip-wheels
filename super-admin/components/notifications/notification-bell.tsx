"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/api/notifications";
import { queryKeys } from "@/lib/query-keys";
import { formatWaitingFor } from "@/lib/format";
import type { NotificationItem } from "@/types/notifications";
import { clsx } from "clsx";

export function getNotificationLink(notification: NotificationItem): string {
  const data = notification.data || {};
  const event = notification.event || "";

  if (data.publisherId) return `/verifications/${data.publisherId}`;
  if (data.bookingId) return `/bookings/${data.bookingId}`;
  if (data.issueId) return `/issues/${data.issueId}`;
  if (data.vehicleId) return `/vehicles/${data.vehicleId}`;
  if (data.taskId) return `/tasks`;

  if (event.includes("verification")) return "/verifications";
  if (event.includes("vehicle")) return "/vehicles";
  if (event.includes("issue")) return "/issues";
  if (event.includes("booking")) return "/bookings";
  if (event.includes("task")) return "/tasks";

  return "/notifications";
}

export const NotificationBell: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications.list,
    queryFn: () => getNotifications(1, 10),
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list });
    },
  });

  const items = notificationsQuery.data?.items || [];
  const unreadCount =
    notificationsQuery.data?.unreadCount ??
    items.filter((item) => !item.readAt).length;

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.readAt) {
      await markReadMutation.mutateAsync(item._id);
    }
    setOpen(false);
    const targetLink = getNotificationLink(item);
    router.push(targetLink);
  };

  return (
    <>
      {/* Mobile view link directly to /notifications */}
      <Link
        href="/notifications"
        aria-label="View notifications"
        className="sm:hidden relative p-2 rounded text-ink-soft hover:text-ink hover:bg-brand-tint focus-visible:outline-2 focus-visible:outline-brand"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-brand" />
        )}
      </Link>

      {/* Desktop view Popover dropdown */}
      <div className="hidden sm:block">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Notifications"
              className="relative p-2 rounded text-ink-soft hover:text-ink hover:bg-brand-tint focus-visible:outline-2 focus-visible:outline-brand cursor-pointer"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-brand" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0 overflow-hidden">
            <div className="p-3 border-b border-line flex items-center justify-between bg-paper/50">
              <span className="text-xs font-semibold text-ink">Notifications</span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                  className="inline-flex items-center gap-1 text-xs text-brand hover:text-brand-dark cursor-pointer font-medium"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Mark all as read</span>
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-line">
              {items.length === 0 ? (
                <div className="p-6 text-center text-xs text-ink-soft">
                  No notifications.
                </div>
              ) : (
                items.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className={clsx(
                      "w-full text-left p-3 hover:bg-brand-tint/30 transition-colors block cursor-pointer",
                      !item.readAt && "bg-brand-tint/10"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={clsx("text-xs font-medium text-ink", !item.readAt && "font-semibold")}>
                        {item.title}
                      </span>
                      {!item.readAt && (
                        <span className="h-1.5 w-1.5 rounded-full bg-brand shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-ink-soft mt-0.5 line-clamp-2">
                      {item.body}
                    </p>
                    <span className="text-[10px] text-ink-soft/80 mt-1 block">
                      {formatWaitingFor(item.createdAt)} ago
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="p-2 border-t border-line text-center bg-paper/30">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="text-xs text-brand hover:text-brand-dark font-medium block py-1"
              >
                View all notifications
              </Link>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
};
