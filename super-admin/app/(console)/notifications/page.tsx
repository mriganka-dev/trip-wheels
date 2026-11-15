"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/api/notifications";
import { getNotificationLink } from "@/components/notifications/notification-bell";
import { queryKeys } from "@/lib/query-keys";
import { formatWaitingFor } from "@/lib/format";
import type { NotificationItem } from "@/types/notifications";
import { clsx } from "clsx";

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const notificationsQuery = useQuery({
    queryKey: ["notifications", "list", page],
    queryFn: () => getNotifications(page, 20),
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list });
      queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list });
      queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
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
    const targetLink = getNotificationLink(item);
    router.push(targetLink);
  };

  return (
    <AppShell
      title="Notifications"
      contextLine="Platform operations events and queue activity."
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="text-sm text-ink-soft">
            {unreadCount > 0 ? (
              <span>
                <strong className="text-ink font-semibold">{unreadCount}</strong> unread notification{unreadCount === 1 ? "" : "s"}
              </span>
            ) : (
              <span>All notifications caught up</span>
            )}
          </div>

          {unreadCount > 0 && (
            <Button
              type="button"
              variant="quiet"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              isLoading={markAllReadMutation.isPending}
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              <span>Mark all as read</span>
            </Button>
          )}
        </div>

        {notificationsQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No notifications."
            description="You are caught up with all platform events."
          />
        ) : (
          <div className="bg-surface border border-line rounded divide-y divide-line overflow-hidden">
            {items.map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={() => handleItemClick(item)}
                className={clsx(
                  "w-full text-left p-4 hover:bg-brand-tint/20 transition-colors flex items-start justify-between gap-4 cursor-pointer",
                  !item.readAt && "bg-brand-tint/10"
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={clsx("text-sm text-ink", !item.readAt ? "font-semibold" : "font-medium")}>
                      {item.title}
                    </span>
                    {!item.readAt && (
                      <span className="h-2 w-2 rounded-full bg-brand shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-ink-soft mt-1">
                    {item.body}
                  </p>
                </div>
                <span className="text-xs text-ink-soft shrink-0">
                  {formatWaitingFor(item.createdAt)} ago
                </span>
              </button>
            ))}
          </div>
        )}

        {notificationsQuery.data && notificationsQuery.data.totalPages > 1 && (
          <Pagination
            page={notificationsQuery.data.page}
            limit={notificationsQuery.data.limit}
            totalItems={notificationsQuery.data.totalItems}
            totalPages={notificationsQuery.data.totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </AppShell>
  );
}
