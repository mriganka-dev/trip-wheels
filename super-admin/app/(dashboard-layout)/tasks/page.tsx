"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Phone, UserCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { FilterBar } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/use-auth";
import { usePageTitle } from "@/hooks/use-page-title";
import { getAdminTasks, updateAdminTask } from "@/lib/api/tasks";
import {
  getTaskStatusMeta,
  getTaskTypeLabel,
  TASK_TYPE_LABELS,
} from "@/lib/constants";
import { formatDateTime, formatPhone } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import type { AdminTask, TaskStatus, UpdateTaskPayload } from "@/types/tasks";

export default function TasksPage() {
  usePageTitle("Tasks");
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Edit / Action Dialog state
  const [selectedTask, setSelectedTask] = useState<AdminTask | null>(null);
  const [dialogStatus, setDialogStatus] = useState<TaskStatus>("open");
  const [dialogNote, setDialogNote] = useState<string>("");
  const [dialogAssignedTo, setDialogAssignedTo] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);

  const tasksQuery = useQuery({
    queryKey: queryKeys.tasks.list({ page, status: statusFilter, type: typeFilter }),
    queryFn: () =>
      getAdminTasks({
        page,
        limit: 15,
        status: statusFilter,
        type: typeFilter,
      }),
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: UpdateTaskPayload }) =>
      updateAdminTask(taskId, payload),
    onSuccess: () => {
      showToast("Task updated successfully", "brand");
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview });
      setSelectedTask(null);
    },
    onError: () => {
      showToast("Failed to update task", "negative");
    },
  });

  const handleOpenAction = (task: AdminTask) => {
    setSelectedTask(task);
    setDialogStatus(task.status);
    setDialogNote(task.note || "");
    setDialogAssignedTo(task.assignedTo?._id || null);
    setNoteError(null);
  };

  const handleSaveAction = async () => {
    if (!selectedTask) return;

    // Completing a call task asks for a short outcome note
    const isCallTask = selectedTask.type.startsWith("call_");
    if (dialogStatus === "done" && isCallTask && dialogNote.trim().length === 0) {
      setNoteError("A short outcome note is required when completing a call task");
      return;
    }

    setNoteError(null);
    await updateTaskMutation.mutateAsync({
      taskId: selectedTask._id,
      payload: {
        status: dialogStatus,
        note: dialogNote.trim(),
        assignedTo: dialogAssignedTo,
      },
    });
  };

  const handleAssignToMe = () => {
    if (user?._id) {
      setDialogAssignedTo(user._id);
    }
  };

  const columns: Column<AdminTask>[] = [
    {
      key: "type",
      header: "Task",
      isPrimary: true,
      render: (task) => (
        <div className="flex flex-col">
          <span className="font-semibold text-ink text-sm">
            {getTaskTypeLabel(task.type)}
          </span>
          {task.note && (
            <span className="text-xs text-ink-soft mt-0.5 line-clamp-1">
              {task.note}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "publisher",
      header: "Owner",
      render: (task) => {
        if (!task.publisher) return <span className="text-ink-soft">None</span>;
        return (
          <div className="flex flex-col">
            <span className="font-medium text-ink">{task.publisher.fullName}</span>
            {task.publisher.phone && (
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-ink-soft">
                <a
                  href={`tel:${task.publisher.phone}`}
                  className="hover:text-brand inline-flex items-center gap-1"
                >
                  <Phone className="h-3 w-3" />
                  <span>{formatPhone(task.publisher.phone)}</span>
                </a>
                <CopyButton value={task.publisher.phone} label="Copy" />
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "booking",
      header: "Booking",
      render: (task) => {
        if (!task.booking) return <span className="text-ink-soft">-</span>;
        const bookingId = typeof task.booking === "object" ? task.booking._id : task.booking;
        const code =
          typeof task.booking === "object" && task.booking.bookingCode
            ? task.booking.bookingCode
            : bookingId.slice(-6).toUpperCase();

        return (
          <Link
            href={`/bookings/${bookingId}`}
            className="text-xs font-mono text-brand hover:text-brand-dark font-medium underline underline-offset-2"
          >
            {code}
          </Link>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (task) => {
        const meta = getTaskStatusMeta(task.status);
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      key: "assignedTo",
      header: "Assigned To",
      render: (task) => (
        <span className="text-xs text-ink-soft">
          {task.assignedTo?.fullName || "Unassigned"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (task) => (
        <span className="text-xs text-ink-soft whitespace-nowrap">
          {formatDateTime(task.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      className: "text-right",
      render: (task) => (
        <Button
          type="button"
          variant="quiet"
          size="sm"
          onClick={() => handleOpenAction(task)}
        >
          Update
        </Button>
      ),
    },
  ];

  const typeOptions = [
    { label: "All types", value: "all" },
    ...Object.entries(TASK_TYPE_LABELS).map(([val, label]) => ({
      label,
      value: val,
    })),
  ];

  return (
    <AppShell
      title="Tasks"
      contextLine="Actionable platform queue items, owner phone calls, and issue reviews."
    >
      <div className="space-y-4">
        {/* Filters */}
        <FilterBar className="mb-2">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { label: "Open & In Progress", value: "open" },
              { label: "In Progress only", value: "in_progress" },
              { label: "Completed (Done)", value: "done" },
              { label: "All Statuses", value: "all" },
            ]}
          />

          <Select
            value={typeFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            options={typeOptions}
          />
        </FilterBar>

        {/* Tasks Table */}
        <DataTable
          columns={columns}
          data={tasksQuery.data?.items || []}
          keyExtractor={(item) => item._id}
          isLoading={tasksQuery.isLoading}
          emptyMessage="No tasks found matching your filters."
        />

        {/* Pagination */}
        {tasksQuery.data && tasksQuery.data.totalPages > 1 && (
          <Pagination
            page={tasksQuery.data.page}
            limit={tasksQuery.data.limit}
            totalItems={tasksQuery.data.totalItems}
            totalPages={tasksQuery.data.totalPages}
            onPageChange={setPage}
          />
        )}

        {/* Task Update Dialog */}
        <Dialog open={Boolean(selectedTask)} onOpenChange={(open) => !open && setSelectedTask(null)}>
          <DialogContent
            title="Update Admin Task"
            description={selectedTask ? getTaskTypeLabel(selectedTask.type) : ""}
            className="max-w-md"
          >
            {selectedTask && (
              <div className="space-y-4">
                {selectedTask.publisher && (
                  <div className="bg-paper p-3 rounded border border-line text-xs">
                    <span className="font-semibold text-ink block">
                      Owner: {selectedTask.publisher.fullName}
                    </span>
                    {selectedTask.publisher.phone && (
                      <span className="text-ink-soft block mt-0.5">
                        Phone: {formatPhone(selectedTask.publisher.phone)}
                      </span>
                    )}
                  </div>
                )}

                <Field label="Task Status">
                  <Select
                    value={dialogStatus}
                    onChange={(e) => setDialogStatus(e.target.value as TaskStatus)}
                    options={[
                      { label: "Open", value: "open" },
                      { label: "In Progress", value: "in_progress" },
                      { label: "Done", value: "done" },
                    ]}
                  />
                </Field>

                <div className="flex items-center justify-between p-2.5 rounded border border-line bg-surface text-xs">
                  <div>
                    <span className="text-ink-soft">Assigned to:</span>
                    <span className="font-medium text-ink ml-1.5">
                      {dialogAssignedTo === user?._id
                        ? "You"
                        : selectedTask.assignedTo?.fullName || "Unassigned"}
                    </span>
                  </div>
                  {dialogAssignedTo !== user?._id && (
                    <Button
                      type="button"
                      variant="quiet"
                      size="sm"
                      onClick={handleAssignToMe}
                    >
                      <UserCheck className="h-3.5 w-3.5 mr-1" />
                      Assign to me
                    </Button>
                  )}
                </div>

                <Field
                  label={
                    dialogStatus === "done" && selectedTask.type.startsWith("call_")
                      ? "Outcome note (required for completed calls)"
                      : "Task note"
                  }
                  required={dialogStatus === "done" && selectedTask.type.startsWith("call_")}
                  error={noteError || undefined}
                  hint="e.g. Spoke to owner, vehicle confirmed"
                >
                  <Textarea
                    value={dialogNote}
                    onChange={(e) => {
                      setDialogNote(e.target.value);
                      if (noteError) setNoteError(null);
                    }}
                    placeholder="Enter short outcome or task progress note..."
                    rows={3}
                    hasError={Boolean(noteError)}
                  />
                </Field>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                  <Button
                    type="button"
                    variant="quiet"
                    onClick={() => setSelectedTask(null)}
                    disabled={updateTaskMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleSaveAction}
                    isLoading={updateTaskMutation.isPending}
                  >
                    Save updates
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
