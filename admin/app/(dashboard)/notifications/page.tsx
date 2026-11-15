"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/notifications";
import { formatNotification } from "@/lib/notification-format";
import { formatDateTime } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import {
  getPushPermissionState,
  isPushSupported,
  subscribeToPush,
} from "@/lib/push";
import type { NotificationItem } from "@/types/notification";

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [page, setPage] = useState(1);
  const limit = 20;

  const [pushPermission, setPushPermission] = useState<
    "granted" | "denied" | "default" | "unsupported"
  >("default");
  const [isEnablingPush, setIsEnablingPush] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPushPermission(getPushPermissionState());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleTurnOnPush = async () => {
    if (!isPushSupported()) {
      showToast("Push notifications are not supported on this browser.", "neutral");
      return;
    }
    setIsEnablingPush(true);
    try {
      await subscribeToPush();
      setPushPermission("granted");
      showToast("Push notifications turned on.", "brand");
    } catch (err) {
      setPushPermission(getPushPermissionState());
      showToast(
        err instanceof Error ? err.message : "Failed to turn on notifications.",
        "negative"
      );
    } finally {
      setIsEnablingPush(false);
    }
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.notifications.list({ page, limit }),
    queryFn: () => getNotifications({ page, limit }),
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      showToast("All notifications marked as read.", "brand");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => {
      showToast("Failed to mark all as read.", "negative");
    },
  });

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleItemClick = (item: NotificationItem, href: string) => {
    if (!item.readAt) {
      markReadMutation.mutate(item._id);
    }
    router.push(href);
  };

  return (
    <AppShell
      title="Alerts & Notifications"
      subtitle="Stay updated on booking requests, confirmations, and account activity"
      actions={
        unreadCount > 0 ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
          >
            <CheckCheck className="w-4 h-4 mr-1.5" />
            Mark all as read
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {pushPermission === "default" && (
          <div className="rounded-md border border-(--line) bg-(--surface) p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded bg-(--brand)/10 text-(--brand) flex items-center justify-center shrink-0 mt-0.5">
                <Bell className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold text-(--ink)">
                  Turn on push notifications
                </h3>
                <p className="text-xs text-(--ink-soft)">
                  We will alert you when a customer sends a request, when you need to confirm a vehicle, and when something changes on a trip.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              isLoading={isEnablingPush}
              onClick={handleTurnOnPush}
              className="shrink-0 w-full sm:w-auto"
            >
              Turn on notifications
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-md" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
            <p className="text-sm text-rose-800">
              Could not load notifications. Please try again.
            </p>
            <Button size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No alerts right now"
            description="You will be notified when customers send requests, when vehicle confirmations are due, or when trips update."
          />
        ) : (
          <div className="rounded-md border border-(--line) bg-(--surface) divide-y divide-(--line)">
            {items.map((item) => {
              const formatted = formatNotification(item);
              const isUnread = !item.readAt;

              return (
                <div
                  key={item._id}
                  onClick={() => handleItemClick(item, formatted.href)}
                  className={`p-4 flex items-start gap-4 transition-colors cursor-pointer hover:bg-(--surface-soft) ${
                    isUnread ? "bg-(--brand)/5" : ""
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleItemClick(item, formatted.href);
                    }
                  }}
                >
                  <div className="pt-1 shrink-0">
                    <span
                      className={`block h-2.5 w-2.5 rounded-full ${
                        isUnread ? "bg-(--brand)" : "bg-transparent border border-(--line)"
                      }`}
                      aria-label={isUnread ? "Unread alert" : "Read alert"}
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                      <h2
                        className={`text-sm ${
                          isUnread
                            ? "font-semibold text-(--ink)"
                            : "font-medium text-(--ink)"
                        }`}
                      >
                        {formatted.title}
                      </h2>
                      <time className="text-xs text-(--ink-soft) shrink-0">
                        {formatDateTime(item.createdAt)}
                      </time>
                    </div>

                    {formatted.body && (
                      <p className="text-xs text-(--ink-soft) leading-relaxed">
                        {formatted.body}
                      </p>
                    )}
                  </div>

                  <div className="self-center pl-2 shrink-0 text-(--ink-soft)">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </AppShell>
  );
}
