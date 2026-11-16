"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Eye } from "lucide-react";
import { getAuditLogs } from "@/lib/api/system";
import type { AuditActor, AuditLogItem, AuditLogQuery } from "@/types/system";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ErrorState } from "@/components/ui/error-state";

const ACTION_OPTIONS = [
  { label: "All actions", value: "all" },
  { label: "Update settings", value: "update_settings" },
  { label: "Approve verification", value: "approve_verification" },
  { label: "Reject verification", value: "reject_verification" },
  { label: "Require reverification", value: "reverify_verification" },
  { label: "Suspend publisher", value: "suspend_verification" },
  { label: "Approve vehicle", value: "approve_vehicle" },
  { label: "Reject vehicle", value: "reject_vehicle" },
  { label: "Suspend vehicle", value: "suspend_vehicle" },
  { label: "Unsuspend vehicle", value: "unsuspend_vehicle" },
  { label: "Resolve issue", value: "resolve_issue" },
  { label: "Dismiss issue", value: "dismiss_issue" },
  { label: "Suspend user", value: "suspend_user" },
  { label: "Unsuspend user", value: "unsuspend_user" },
  { label: "Confirm user phone", value: "confirm_user_phone" },
  { label: "Create destination", value: "create_destination" },
  { label: "Update destination", value: "update_destination" },
];

const TARGET_TYPE_OPTIONS = [
  { label: "All target types", value: "all" },
  { label: "Setting", value: "Setting" },
  { label: "Publisher profile", value: "PublisherProfile" },
  { label: "Vehicle", value: "Vehicle" },
  { label: "Booking", value: "Booking" },
  { label: "Issue", value: "Issue" },
  { label: "User", value: "User" },
  { label: "Destination", value: "Destination" },
];

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [action, setAction] = useState("all");
  const [targetType, setTargetType] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<AuditLogItem | null>(null);

  // Build query
  const query: AuditLogQuery = {
    page,
    limit,
    action: action === "all" ? undefined : action,
    targetType: targetType === "all" ? undefined : targetType,
    from: fromDate ? new Date(`${fromDate}T00:00:00.000Z`).toISOString() : undefined,
    to: toDate ? new Date(`${toDate}T23:59:59.999Z`).toISOString() : undefined,
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "audit-logs", query],
    queryFn: () => getAuditLogs(query),
  });

  const handleResetFilters = () => {
    setAction("all");
    setTargetType("all");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const formatActor = (actor: AuditActor | string) => {
    if (!actor) return "System";
    if (typeof actor === "string") return actor;
    return `${actor.fullName} (${actor.role})`;
  };

  const getTargetLink = (type: string, id: unknown): string | null => {
    if (!id || typeof id !== "string") return null;
    switch (type) {
      case "Booking":
        return `/bookings/${id}`;
      case "Vehicle":
        return `/vehicles/${id}`;
      case "PublisherProfile":
        return `/verifications/${id}`;
      case "User":
        return `/users/${id}`;
      case "Issue":
        return `/issues/${id}`;
      case "Destination":
        return `/destinations`;
      case "Setting":
        return `/settings`;
      default:
        return null;
    }
  };

  const columns: Column<AuditLogItem>[] = [
    {
      key: "createdAt",
      header: "Timestamp",
      render: (item) => {
        try {
          return (
            <span className="font-mono text-xs text-ink">
              {format(new Date(item.createdAt), "dd MMM yyyy, HH:mm:ss")}
            </span>
          );
        } catch {
          return <span className="text-xs text-ink-soft">No data</span>;
        }
      },
    },
    {
      key: "actor",
      header: "Actor",
      render: (item) => {
        if (!item.actor || typeof item.actor === "string") {
          return (
            <span className="text-xs text-ink-soft">
              {typeof item.actor === "string" ? item.actor : "System"}
            </span>
          );
        }
        return (
          <div className="text-xs">
            <p className="font-semibold text-ink">{item.actor.fullName}</p>
            <p className="text-ink-soft">{item.actor.email}</p>
          </div>
        );
      },
    },
    {
      key: "action",
      header: "Action",
      render: (item) => (
        <span className="font-mono text-xs text-brand font-medium">
          {item.action}
        </span>
      ),
    },
    {
      key: "targetType",
      header: "Target type",
      render: (item) => (
        <Badge tone="neutral" className="text-xs font-mono">
          {item.targetType}
        </Badge>
      ),
    },
    {
      key: "targetId",
      header: "Target reference",
      render: (item) => {
        const link = getTargetLink(item.targetType, item.targetId);
        const displayId =
          item.targetId !== null && item.targetId !== undefined
            ? String(item.targetId)
            : "No data";

        if (link && displayId !== "No data") {
          return (
            <Link
              href={link}
              className="text-xs font-mono text-brand underline underline-offset-2 hover:opacity-80"
            >
              {displayId}
            </Link>
          );
        }
        return <span className="text-xs font-mono text-ink-soft">{displayId}</span>;
      },
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (item) => (
        <div className="flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectedEntry(item)}
            className="flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Details</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-ink">Audit log</h1>
        <p className="text-sm text-ink-soft mt-1">
          Immutable, read-only record of administrative actions, platform modifications, and status changes.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface border border-line rounded p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-semibold text-ink block mb-1">
              Action
            </label>
            <Select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              options={ACTION_OPTIONS}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink block mb-1">
              Target type
            </label>
            <Select
              value={targetType}
              onChange={(e) => {
                setTargetType(e.target.value);
                setPage(1);
              }}
              options={TARGET_TYPE_OPTIONS}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink block mb-1">
              From date
            </label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink block mb-1">
              To date
            </label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-line/60">
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="text-xs bg-surface border border-line rounded px-2 py-1 text-ink focus:outline-brand"
            >
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>

          <Button variant="quiet" size="sm" onClick={handleResetFilters}>
            Reset filters
          </Button>
        </div>
      </div>

      {/* Main Table */}
      {isError ? (
        <ErrorState
          title="Failed to load audit logs"
          message="Could not fetch audit log records from the server."
          onRetry={() => {
            refetch();
          }}
        />
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            data={data?.items || []}
            keyExtractor={(item) => item._id}
            isLoading={isLoading}
            emptyMessage="No audit log entries match the selected filters."
          />

          {data && data.totalItems > 0 && (
            <Pagination
              page={data.page}
              limit={data.limit}
              totalItems={data.totalItems}
              totalPages={data.totalPages}
              onPageChange={(newPage) => setPage(newPage)}
            />
          )}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog
        open={Boolean(selectedEntry)}
        onOpenChange={(open) => !open && setSelectedEntry(null)}
      >
        <DialogContent
          title="Audit log entry details"
          className="max-w-2xl max-h-[85vh] overflow-y-auto"
        >
          {selectedEntry && (
            <div className="space-y-5 text-sm">
              {/* Metadata block */}
              <div className="bg-paper p-3.5 rounded border border-line space-y-2">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-ink-soft uppercase font-medium block">
                      Timestamp
                    </span>
                    <span className="font-mono text-ink">
                      {format(
                        new Date(selectedEntry.createdAt),
                        "dd MMMM yyyy, HH:mm:ss"
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-ink-soft uppercase font-medium block">
                      Actor
                    </span>
                    <span className="text-ink font-medium">
                      {formatActor(selectedEntry.actor)}
                    </span>
                  </div>

                  <div>
                    <span className="text-ink-soft uppercase font-medium block">
                      Action
                    </span>
                    <span className="font-mono text-brand font-semibold">
                      {selectedEntry.action}
                    </span>
                  </div>

                  <div>
                    <span className="text-ink-soft uppercase font-medium block">
                      Target
                    </span>
                    <span className="font-mono text-ink">
                      {selectedEntry.targetType}:{" "}
                      {selectedEntry.targetId !== null &&
                      selectedEntry.targetId !== undefined
                        ? String(selectedEntry.targetId)
                        : "No data"}
                    </span>
                  </div>

                  {selectedEntry.ip && (
                    <div>
                      <span className="text-ink-soft uppercase font-medium block">
                        IP address
                      </span>
                      <span className="font-mono text-ink">
                        {selectedEntry.ip}
                      </span>
                    </div>
                  )}

                  {selectedEntry.userAgent && (
                    <div className="col-span-2">
                      <span className="text-ink-soft uppercase font-medium block">
                        User agent
                      </span>
                      <span className="font-mono text-[11px] text-ink-soft break-all">
                        {selectedEntry.userAgent}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Before and After Two-Column List */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">
                  State comparison
                </h3>

                <DiffList
                  before={selectedEntry.before}
                  after={selectedEntry.after}
                />
              </div>

              <div className="flex justify-end pt-2 border-t border-line">
                <Button variant="secondary" onClick={() => setSelectedEntry(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface DiffListProps {
  before?: unknown;
  after?: unknown;
}

function DiffList({ before, after }: DiffListProps) {
  const isObject = (val: unknown): val is Record<string, unknown> => {
    return typeof val === "object" && val !== null && !Array.isArray(val);
  };

  const formatValue = (val: unknown): string => {
    if (val === undefined || val === null) return "No data";
    if (typeof val === "object") {
      try {
        return JSON.stringify(val, null, 2);
      } catch {
        return String(val);
      }
    }
    return String(val);
  };

  // If both are objects, render clean two-column comparison table
  if (isObject(before) || isObject(after)) {
    const objBefore = (isObject(before) ? before : {}) as Record<
      string,
      unknown
    >;
    const objAfter = (isObject(after) ? after : {}) as Record<string, unknown>;

    const allKeys = Array.from(
      new Set([...Object.keys(objBefore), ...Object.keys(objAfter)])
    ).filter(
      (k) =>
        k !== "__v" &&
        k !== "password" &&
        k !== "refreshToken" &&
        k !== "token"
    );

    if (allKeys.length === 0) {
      return (
        <div className="p-4 text-center text-xs text-ink-soft border border-line rounded bg-paper">
          No field changes recorded for this entry.
        </div>
      );
    }

    return (
      <div className="border border-line rounded overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-paper border-b border-line text-ink-soft uppercase font-semibold">
              <th className="p-2.5 w-1/3">Field</th>
              <th className="p-2.5 w-1/3">Before</th>
              <th className="p-2.5 w-1/3">After</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {allKeys.map((key) => {
              const bVal = objBefore[key];
              const aVal = objAfter[key];
              const isDifferent =
                JSON.stringify(bVal) !== JSON.stringify(aVal);

              return (
                <tr
                  key={key}
                  className={isDifferent ? "bg-brand-tint/20" : undefined}
                >
                  <td className="p-2.5 font-mono text-ink font-medium break-all align-top">
                    {key}
                  </td>
                  <td className="p-2.5 font-mono text-ink-soft break-all align-top">
                    {formatValue(bVal)}
                  </td>
                  <td className="p-2.5 font-mono text-ink break-all align-top font-medium">
                    {formatValue(aVal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Fallback for primitive or array values
  return (
    <div className="grid grid-cols-2 gap-3 text-xs">
      <div className="p-3 bg-paper rounded border border-line">
        <p className="font-semibold text-ink-soft uppercase mb-1">Before</p>
        <pre className="font-mono text-ink whitespace-pre-wrap break-all">
          {formatValue(before)}
        </pre>
      </div>

      <div className="p-3 bg-paper rounded border border-line">
        <p className="font-semibold text-ink uppercase mb-1">After</p>
        <pre className="font-mono text-ink whitespace-pre-wrap break-all">
          {formatValue(after)}
        </pre>
      </div>
    </div>
  );
}
