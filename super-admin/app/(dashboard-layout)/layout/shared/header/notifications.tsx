"use client";

import React from "react";
import Link from "next/link";
import useSWR from "swr";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/api/notifications";
import { formatWaitingFor } from "@/lib/format";

const Notifications = ({ className }: { className?: string }) => {
  const { data, mutate } = useSWR(
    "/notifications",
    () => getNotifications(1, 10),
    { refreshInterval: 30000, shouldRetryOnError: false }
  );

  const notifications = data?.items || [];
  const unreadCount = data?.unreadCount ?? notifications.filter((n) => !n.readAt).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      mutate();
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      mutate();
    } catch {
      // ignore
    }
  };

  return (
    <div className={cn("", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <div className="relative cursor-pointer">
            {unreadCount > 0 && (
              <>
                <span className="h-2 w-2 bg-destructive rounded-full absolute top-1.5 end-2 text-white z-1 animate-ping" />
                <span className="h-2 w-2 bg-destructive rounded-full absolute top-1.5 end-2 text-white z-1" />
              </>
            )}
            <div className="flex justify-center items-center hover:bg-primary/5 w-10 h-10 rounded-full">
              <Bell className="size-5" />
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-screen sm:w-[360px] py-4 px-0"
        >
          <div className="flex items-center px-6 justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Notifications</h3>
              {unreadCount > 0 ? (
                <Badge className="px-2 py-0 bg-primary text-[11px]">{unreadCount} new</Badge>
              ) : (
                <Badge className="px-2 py-0 bg-muted text-muted-foreground text-[11px]">Up to date</Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="xs"
                onClick={handleMarkAllRead}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1"
              >
                <CheckCheck size={13} />
                Mark all read
              </Button>
            )}
          </div>

          {/* List */}
          <SimpleBar className="max-h-80 mt-1">
            {notifications.length === 0 ? (
              <div className="py-8 px-4 text-center flex flex-col items-center justify-center">
                <Inbox size={24} className="text-muted-foreground/50 mb-2" />
                <p className="text-xs text-muted-foreground">No notifications</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => handleMarkAsRead(item._id)}
                    className={cn(
                      "px-6 py-3 flex justify-between items-start hover:bg-muted/30 cursor-pointer border-b border-border/40 transition-colors",
                      !item.readAt && "bg-primary/5"
                    )}
                  >
                    <div className="flex flex-col flex-1 gap-0.5">
                      <div className="flex items-center justify-between">
                        <h5 className={cn("text-xs", !item.readAt ? "font-semibold text-foreground" : "font-normal text-muted-foreground")}>
                          {item.title}
                        </h5>
                        <span className="text-[10px] text-muted-foreground">
                          {formatWaitingFor(item.createdAt)} ago
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SimpleBar>

          {/* Footer Button */}
          <div className="pt-3 px-6 border-t border-border mt-2">
            <Link href="/notifications" className="w-full block">
              <Button variant="outline" size="sm" className="w-full text-xs cursor-pointer">
                View All Notifications
              </Button>
            </Link>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default Notifications;
