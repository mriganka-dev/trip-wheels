"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/api/notifications";
import { getPushStatus, subscribeToPush, type PushStatus } from "@/lib/push";
import { queryKeys } from "@/lib/query-keys";
import { formatDateTime } from "@/lib/format";
import type { AppNotification } from "@/types/notification";

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pushStatus, setPushStatus] = useState<PushStatus>("off");
  const [isSubscribingPush, setIsSubscribingPush] = useState(false);

  useEffect(() => {
    getPushStatus().then((status) => setPushStatus(status));
  }, []);

  const handleEnablePush = async () => {
    setIsSubscribingPush(true);
    await subscribeToPush();
    const updated = await getPushStatus();
    setPushStatus(updated);
    setIsSubscribingPush(false);
  };

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.notifications.all(),
    queryFn: () => getNotifications(1, 50),
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

  const notifications = data?.items || [];
  const unreadCount = data?.unreadCount || 0;

  const handleItemClick = (item: AppNotification) => {
    if (!item.readAt) {
      markReadMutation.mutate(item._id);
    }

    const targetLink =
      item.data?.link ||
      (item.data?.bookingId ? `/bookings/${item.data.bookingId}` : null) ||
      (item.data?.issueId ? `/issues/${item.data.issueId}` : null) ||
      "/bookings";

    router.push(targetLink);
  };

  return (
    <div className="py-8 sm:py-12">
      <Container size="default">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
              Notifications
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Trip updates, owner responses, and account notices.
            </p>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => markAllMutation.mutate()}
              isLoading={markAllMutation.isPending}
            >
              Mark all as read
            </Button>
          )}
        </header>

        {/* Push notification opt-in prompt */}
        {pushStatus === "off" && (
          <div className="mb-6 rounded-lg border border-line bg-paper-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-serif text-sm font-bold text-ink">
                Turn on push notifications
              </h2>
              <p className="mt-0.5 text-xs text-ink-muted">
                We will tell you when the owner accepts, and about changes to your trip.
              </p>
            </div>

            <Button
              size="sm"
              variant="primary"
              onClick={handleEnablePush}
              isLoading={isSubscribingPush}
            >
              Turn on notifications
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : isError ? (
          <ErrorState
            title="Failed to load notifications"
            message={error instanceof Error ? error.message : "Unable to retrieve notifications."}
            onRetry={() => refetch()}
          />
        ) : notifications.length === 0 ? (
          <EmptyState
            title="No notifications yet"
            description="When you send booking requests or receive updates from vehicle owners, your notifications will appear here."
            actionLabel="Browse Vehicles"
            onAction={() => {
              router.push("/search");
            }}
          />
        ) : (
          <div className="rounded-lg border border-line bg-paper-card divide-y divide-line overflow-hidden">
            {notifications.map((item) => {
              const isUnread = !item.readAt;

              return (
                <div
                  key={item._id}
                  onClick={() => handleItemClick(item)}
                  className={`flex cursor-pointer items-start gap-3 p-4 sm:p-5 transition-colors hover:bg-paper-light ${
                    isUnread ? "bg-brand/5" : ""
                  }`}
                >
                  <div className="mt-1 flex h-2 w-2 shrink-0 items-center justify-center">
                    {isUnread && (
                      <span className="h-2 w-2 rounded-full bg-brand" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <h2
                        className={`text-sm ${
                          isUnread ? "font-bold text-ink" : "font-medium text-ink"
                        }`}
                      >
                        {item.title}
                      </h2>
                      <span className="text-xs text-ink-muted shrink-0">
                        {formatDateTime(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-ink-muted leading-relaxed">
                      {item.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
