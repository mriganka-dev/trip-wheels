"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/use-auth";
import { getIssue, respondToIssue } from "@/lib/api/issues";
import { formatDateTime } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import type { Issue } from "@/types/issue";

const ISSUE_TYPE_LABELS: Record<string, string> = {
  customer_damage: "Customer caused vehicle damage",
  late_return: "Customer returned vehicle late",
  customer_no_show: "Customer did not show up for pickup",
  misconduct: "Customer misconduct",
  not_as_promised: "Dispute / not as promised",
  vehicle_mismatch: "Vehicle mismatch",
  chassis_mismatch: "Chassis mismatch",
  registration_mismatch: "Registration mismatch",
  vehicle_damage_undisclosed: "Undisclosed damage",
  vehicle_unavailable_at_pickup: "Vehicle unavailable at pickup",
};

export default function IssueDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [responseText, setResponseText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const {
    data: issue,
    isLoading,
    isError,
    error,
  } = useQuery<Issue>({
    queryKey: queryKeys.issues.detail(id),
    queryFn: () => getIssue(id),
    enabled: Boolean(id),
  });

  const responseMutation = useMutation({
    mutationFn: async () => {
      setErrorMessage(null);
      if (!responseText.trim() || responseText.trim().length < 3) {
        throw new Error("Please write a response of at least 3 characters.");
      }
      return respondToIssue(id, responseText.trim());
    },
    onSuccess: () => {
      showToast("Response recorded in issue timeline.", "brand");
      setResponseText("");
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.detail(id) });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || "Failed to submit response");
    },
  });

  if (isLoading) {
    return (
      <AppShell title="Issue Details">
        <div className="space-y-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-32 w-full rounded-md" />
          <Skeleton className="h-48 w-full rounded-md" />
        </div>
      </AppShell>
    );
  }

  if (isError || !issue) {
    return (
      <AppShell title="Issue Details">
        <div className="rounded-md border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
          <p className="text-sm text-rose-800">
            {(error as Error)?.message || "Could not load issue details."}
          </p>
          <Button size="sm" onClick={() => router.push("/issues")}>
            Back to issues
          </Button>
        </div>
      </AppShell>
    );
  }

  const typeLabel =
    ISSUE_TYPE_LABELS[issue.type] || issue.type.replace(/_/g, " ");

  const isClosed = issue.status === "resolved" || issue.status === "dismissed";
  const isOtherParty = issue.raisedBy?._id !== user?._id;
  const canRespond = !isClosed && isOtherParty;

  const getStatusTone = (status: string): "warning" | "neutral" | "brand" | "negative" => {
    if (status === "open") return "warning";
    if (status === "under_review") return "brand";
    if (status === "resolved") return "brand";
    return "neutral";
  };

  return (
    <AppShell title="Issue Details">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/issues"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-(--ink-soft) hover:text-(--ink)"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to issues
          </Link>
          <Badge tone={getStatusTone(issue.status)}>
            {issue.status.replace(/_/g, " ")}
          </Badge>
        </div>

        {/* Issue Header */}
        <div className="rounded-md border border-(--line) bg-(--surface) p-6 space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold font-display text-(--ink)">
                {typeLabel}
              </h1>
            </div>
            <p className="text-xs text-(--ink-soft) mt-1">
              Reported on {formatDateTime(issue.createdAt)}
            </p>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm pt-2 border-t border-(--line)">
            <div>
              <dt className="text-xs uppercase tracking-wider font-medium text-(--ink-soft)">
                Booking
              </dt>
              <dd className="font-medium text-(--ink) mt-0.5">
                {issue.booking?._id ? (
                  <Link
                    href={`/bookings/${issue.booking._id}`}
                    className="text-(--brand) hover:underline inline-flex items-center gap-1 font-mono"
                  >
                    {issue.booking.bookingCode}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                ) : (
                  <span className="font-mono">{issue.booking?.bookingCode || "N/A"}</span>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs uppercase tracking-wider font-medium text-(--ink-soft)">
                Reported by
              </dt>
              <dd className="font-medium text-(--ink) mt-0.5">
                {issue.raisedBy?.fullName || "User"}
              </dd>
            </div>

            <div>
              <dt className="text-xs uppercase tracking-wider font-medium text-(--ink-soft)">
                Reported against
              </dt>
              <dd className="font-medium text-(--ink) mt-0.5">
                {issue.against?.fullName || "User"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Resolution Banner if resolved */}
        {issue.resolution && (
          <div className="rounded-md border border-(--brand) bg-(--brand)/5 p-6 space-y-2">
            <div className="flex items-center gap-2 text-(--brand)">
              <CheckCircle2 className="w-5 h-5" />
              <h2 className="text-base font-semibold">Resolution outcome</h2>
            </div>
            <div className="text-sm text-(--ink) space-y-1">
              {issue.resolution.outcome && (
                <p className="font-medium">
                  Outcome: {issue.resolution.outcome.replace(/_/g, " ")}
                </p>
              )}
              {issue.resolution.adminNote && (
                <p className="text-xs text-(--ink-soft) bg-white p-3 rounded border border-(--line)">
                  {issue.resolution.adminNote}
                </p>
              )}
              {issue.resolution.resolvedAt && (
                <p className="text-[11px] text-(--ink-soft)">
                  Resolved on {formatDateTime(issue.resolution.resolvedAt)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Description Section */}
        <section className="rounded-md border border-(--line) bg-(--surface) p-6">
          <h2 className="text-base font-semibold text-(--ink) pb-3 border-b border-(--line)">
            Description
          </h2>
          <p className="text-sm text-(--ink) whitespace-pre-wrap leading-relaxed mt-4">
            {issue.description}
          </p>

          {/* Evidence Photos */}
          {issue.evidence && issue.evidence.length > 0 && (
            <div className="mt-6 pt-4 border-t border-(--line)">
              <h3 className="text-xs uppercase tracking-wider font-medium text-(--ink-soft) mb-3">
                Evidence photos ({issue.evidence.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {issue.evidence.map((ev, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedPhoto(ev.url)}
                    className="relative aspect-square rounded border border-(--line) overflow-hidden hover:opacity-90 transition-opacity cursor-pointer group bg-(--surface-soft)"
                  >
                    <Image
                      src={ev.url}
                      alt={`Evidence ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                      View photo
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Response section for the other party */}
        {canRespond && (
          <section className="rounded-md border border-(--line) bg-(--surface) p-6">
            <div className="pb-3 border-b border-(--line)">
              <h2 className="text-base font-semibold text-(--ink)">
                Your response
              </h2>
              <p className="text-xs text-(--ink-soft) mt-0.5">
                Provide your side of the situation for the Admin team to review.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                responseMutation.mutate();
              }}
              className="mt-4 space-y-4"
            >
              {errorMessage && (
                <div className="flex items-start gap-2 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <Textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Explain what happened from your side..."
                  rows={4}
                  maxLength={1000}
                  required
                />
                <p className="text-[11px] text-(--ink-soft) mt-1">
                  {responseText.length}/1000 characters
                </p>
              </div>

              <Button
                type="submit"
                disabled={responseMutation.isPending}
                className="bg-(--brand) hover:bg-(--brand-hover) text-white"
              >
                {responseMutation.isPending ? "Submitting..." : "Send response"}
              </Button>
            </form>
          </section>
        )}

        {/* Timeline */}
        {issue.timeline && issue.timeline.length > 0 && (
          <section className="rounded-md border border-(--line) bg-(--surface) p-6">
            <h2 className="text-base font-semibold text-(--ink) pb-3 border-b border-(--line)">
              Timeline
            </h2>
            <div className="mt-4 flow-root">
              <ul className="-mb-8">
                {issue.timeline.map((entry, idx) => {
                  const isLast = idx === issue.timeline.length - 1;
                  const author =
                    typeof entry.by === "object" && entry.by !== null
                      ? entry.by.fullName
                      : "User";

                  return (
                    <li key={idx}>
                      <div className="relative pb-8">
                        {!isLast && (
                          <span
                            className="absolute top-4 left-2 -ml-px h-full w-0.5 bg-(--line)"
                            aria-hidden="true"
                          />
                        )}
                        <div className="relative flex items-start space-x-3">
                          <span className="h-4 w-4 rounded-full bg-(--brand)/20 border border-(--brand) flex items-center justify-center ring-4 ring-white mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                              <span className="text-sm font-medium text-(--ink)">
                                {entry.status.replace(/_/g, " ")}
                                {author ? ` by ${author}` : ""}
                              </span>
                              <time className="text-xs text-(--ink-soft)">
                                {formatDateTime(entry.at)}
                              </time>
                            </div>
                            {entry.note && (
                              <p className="text-xs text-(--ink-soft) mt-1 bg-(--surface-soft) p-2.5 rounded border border-(--line)">
                                {entry.note}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}
      </div>

      {/* Enlarged Photo Dialog */}
      <Dialog
        open={Boolean(selectedPhoto)}
        onOpenChange={(open) => !open && setSelectedPhoto(null)}
      >
        <DialogContent
          title="Evidence photo"
          className="max-w-3xl p-4"
        >
          {selectedPhoto && (
            <div className="relative w-full h-[70vh] rounded overflow-hidden">
              <Image
                src={selectedPhoto}
                alt="Enlarged evidence"
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
