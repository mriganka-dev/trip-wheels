"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { getIssueById, respondToIssue } from "@/lib/api/issues";
import { queryKeys } from "@/lib/query-keys";
import { ISSUE_STATUS_CONFIG, ISSUE_TYPE_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";

interface IssueDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function IssueDetailPage({ params }: IssueDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [responseText, setResponseText] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const {
    data: issue,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.issues.detail(id),
    queryFn: () => getIssueById(id),
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const responseMutation = useMutation({
    mutationFn: (text: string) => respondToIssue(id, text),
    onSuccess: (updated) => {
      setResponseText("");
      queryClient.setQueryData(queryKeys.issues.detail(id), updated);
    },
  });

  if (isLoading) {
    return (
      <div className="py-10">
        <Container size="default">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-48 w-full max-w-2xl" />
        </Container>
      </div>
    );
  }

  if (isError || !issue) {
    return (
      <div className="py-12">
        <Container size="default">
          <ErrorState
            title="Issue not found"
            message={error instanceof Error ? error.message : "Unable to retrieve this issue."}
            onRetry={() => router.push("/issues")}
          />
        </Container>
      </div>
    );
  }

  const statusMeta = ISSUE_STATUS_CONFIG[issue.status] || {
    label: issue.status,
    tone: "neutral" as const,
  };
  const typeLabel = ISSUE_TYPE_LABELS[issue.type] || issue.type;

  const handleSendResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (responseText.trim().length < 3) return;
    responseMutation.mutate(responseText.trim());
  };

  return (
    <div className="py-8 sm:py-12">
      <Container size="default">
        {/* Navigation Breadcrumb */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/issues"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to All Issues
          </Link>

          {issue.booking?._id && (
            <Link
              href={`/bookings/${issue.booking._id}`}
              className="text-xs font-semibold text-brand hover:underline"
            >
              View Booking {issue.booking.bookingCode}
            </Link>
          )}
        </div>

        <div className="max-w-2xl space-y-6">
          {/* Header */}
          <header className="rounded-lg border border-line bg-paper-card p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Issue Report
                </span>
                <h1 className="mt-1 font-serif text-2xl font-bold text-ink">
                  {typeLabel}
                </h1>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Reported on {formatDateTime(issue.createdAt)}
                </p>
              </div>

              <div>
                <Badge tone={statusMeta.tone}>
                  {statusMeta.label}
                </Badge>
              </div>
            </div>

            {/* Description */}
            <div className="mt-4 pt-4 border-t border-line">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                Description
              </h2>
              <p className="text-sm text-ink leading-relaxed whitespace-pre-line">
                {issue.description}
              </p>
            </div>
          </header>

          {/* Evidence Photos */}
          {issue.evidence && issue.evidence.length > 0 && (
            <div className="rounded-lg border border-line bg-paper-card p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-3">
                Evidence Photos ({issue.evidence.length})
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {issue.evidence.map((ev, idx) => (
                  <button
                    type="button"
                    key={ev.url || idx}
                    onClick={() => setSelectedPhoto(ev.url)}
                    className="relative h-24 w-full rounded border border-line overflow-hidden bg-paper-light hover:opacity-90 transition-opacity"
                  >
                    <Image
                      src={ev.url}
                      alt={`Evidence ${idx + 1}`}
                      fill
                      sizes="150px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Owner Response */}
          {issue.response?.text && (
            <div className="rounded-lg border border-line bg-paper-card p-5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Owner Response
                </h2>
                {issue.response.at && (
                  <span className="text-[11px] text-ink-muted">
                    {formatDateTime(issue.response.at)}
                  </span>
                )}
              </div>
              <p className="text-sm text-ink leading-relaxed whitespace-pre-line">
                {issue.response.text}
              </p>
            </div>
          )}

          {/* Admin Resolution */}
          {issue.resolution?.outcome && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                  Resolution Decision ({issue.resolution.outcome})
                </span>
                {issue.resolution.resolvedAt && (
                  <span className="text-[11px] text-emerald-700">
                    {formatDateTime(issue.resolution.resolvedAt)}
                  </span>
                )}
              </div>

              {issue.resolution.adminNote && (
                <p className="text-sm text-emerald-900 leading-relaxed whitespace-pre-line">
                  {issue.resolution.adminNote}
                </p>
              )}

              {issue.resolution.penaltyApplied && (
                <p className="mt-2 text-xs font-medium text-emerald-800">
                  • Corrective penalty was applied in accordance with platform policies.
                </p>
              )}
            </div>
          )}

          {/* Timeline */}
          {issue.timeline && issue.timeline.length > 0 && (
            <div className="rounded-lg border border-line bg-paper-card p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-3">
                Timeline
              </h2>
              <ol className="space-y-3" role="list">
                {issue.timeline.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs">
                    <div className="mt-1 h-2 w-2 rounded-full bg-brand shrink-0" />
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="font-semibold text-ink">
                          {typeof item.by === "object" ? item.by.fullName : "Support"}
                        </span>
                        <span className="text-[11px] text-ink-muted">
                          {formatDateTime(item.at)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-ink-muted">{item.note}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Respond Form (if still open or under review) */}
          {(issue.status === "open" || issue.status === "under_review") && (
            <form
              onSubmit={handleSendResponse}
              className="rounded-lg border border-line bg-paper-card p-5 space-y-3"
            >
              <label
                htmlFor="reply-text"
                className="block text-xs font-semibold uppercase tracking-wider text-ink-muted"
              >
                Add Additional Note / Reply
              </label>
              <Textarea
                id="reply-text"
                rows={3}
                placeholder="Provide additional details or update..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                maxLength={2000}
                required
                disabled={responseMutation.isPending}
              />

              {responseMutation.isError && (
                <p className="text-xs text-rose-700">
                  {responseMutation.error instanceof Error
                    ? responseMutation.error.message
                    : "Failed to send response."}
                </p>
              )}

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={responseMutation.isPending}
                >
                  Send Reply
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Photo Modal Preview */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <div
              className="relative max-h-[90vh] max-w-2xl w-full rounded bg-surface p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-3 right-3 z-10 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                aria-label="Close photo"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="relative h-[60vh] w-full">
                <Image
                  src={selectedPhoto}
                  alt="Enlarged evidence photo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
