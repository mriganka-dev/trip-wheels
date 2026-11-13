"use client";

import React, { use, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { getBookingById } from "@/lib/api/bookings";
import { createIssue } from "@/lib/api/issues";
import { queryKeys } from "@/lib/query-keys";
import type { IssueType } from "@/types/issue";

interface IssuePageProps {
  params: Promise<{ id: string }>;
}

const ISSUE_OPTIONS: Array<{ value: IssueType; label: string }> = [
  { value: "vehicle_mismatch", label: "Vehicle does not match" },
  { value: "chassis_mismatch", label: "Chassis number does not match" },
  { value: "registration_mismatch", label: "Registration number does not match" },
  { value: "vehicle_damage_undisclosed", label: "Damage not disclosed" },
  { value: "not_as_promised", label: "Not as promised" },
  { value: "vehicle_unavailable_at_pickup", label: "Vehicle not available at pickup" },
  { value: "misconduct", label: "Owner behaviour" },
  { value: "other", label: "Other problem" },
];

interface FileWithPreview {
  file: File;
  previewUrl: string;
}

export default function BookingIssuePage({ params }: IssuePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [issueType, setIssueType] = useState<IssueType>("vehicle_mismatch");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const {
    data: booking,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: () => getBookingById(id),
  });

  const mutation = useMutation({
    mutationFn: (formData: FormData) => createIssue(id, formData),
    onSuccess: (newIssue) => {
      router.push(`/issues/${newIssue._id}`);
    },
  });

  if (isLoading) {
    return (
      <div className="py-10">
        <Container size="default">
          <Skeleton className="h-6 w-36 mb-4" />
          <Skeleton className="h-48 w-full max-w-xl" />
        </Container>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="py-12">
        <Container size="default">
          <ErrorState
            title="Booking not found"
            message={error instanceof Error ? error.message : "Unable to load booking."}
            onRetry={() => router.push("/bookings")}
          />
        </Container>
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;

    const currentCount = files.length;
    const remainingSlots = 6 - currentCount;

    if (remainingSlots <= 0) {
      setFileError("You can upload a maximum of 6 photos.");
      return;
    }

    const newFiles: FileWithPreview[] = [];
    for (let i = 0; i < Math.min(selected.length, remainingSlots); i++) {
      const file = selected[i];

      // Validate size (5 MB)
      if (file.size > 5 * 1024 * 1024) {
        setFileError(`File "${file.name}" exceeds the 5 MB limit.`);
        continue;
      }

      // Validate type
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setFileError(`File "${file.name}" must be a JPG, PNG, or WebP image.`);
        continue;
      }

      newFiles.push({
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setFiles((prev) => [...prev, ...newFiles]);

    // Reset input value so same files can be re-selected if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => {
      const target = prev[index];
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFileError(null);

    if (description.trim().length < 5) {
      setFileError("Description must be at least 5 characters.");
      return;
    }

    const formData = new FormData();
    formData.append("type", issueType);
    formData.append("description", description.trim());

    files.forEach(({ file }) => {
      formData.append("evidence", file);
    });

    mutation.mutate(formData);
  };

  return (
    <div className="py-8 sm:py-12">
      <Container size="default">
        <div className="mb-4">
          <Link
            href={`/bookings/${id}`}
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
            Back to Booking {booking.bookingCode}
          </Link>
        </div>

        <div className="max-w-xl">
          <header className="mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Booking Support
            </span>
            <h1 className="mt-1 font-serif text-2xl sm:text-3xl font-bold text-ink">
              Report an Issue
            </h1>
            <p className="mt-1 text-xs text-ink-muted">
              Booking {booking.bookingCode} • {booking.vehicle?.brand} {booking.vehicle?.model}
            </p>
          </header>

          {/* Prompt advisory requirement */}
          <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-2.5">
              <svg
                className="h-5 w-5 shrink-0 text-amber-700 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-xs text-amber-900 leading-relaxed font-medium">
                If the vehicle does not match, do not accept it. Report it here and our team will review.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-line bg-paper-card p-6 space-y-5"
          >
            {/* Issue Type */}
            <Field label="Issue Type" htmlFor="issue-type" required>
              <Select
                id="issue-type"
                value={issueType}
                onChange={(e) => setIssueType(e.target.value as IssueType)}
                disabled={mutation.isPending}
              >
                {ISSUE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </Field>

            {/* Description */}
            <div>
              <div className="flex justify-between items-baseline mb-1.5">
                <label
                  htmlFor="issue-description"
                  className="text-xs font-semibold uppercase tracking-wider text-ink-muted"
                >
                  Description <span className="text-rose-700">*</span>
                </label>
                <span className="text-[11px] text-ink-muted">
                  {description.length} / 2000 characters
                </span>
              </div>
              <Textarea
                id="issue-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                rows={4}
                required
                placeholder="Explain what happened or what does not match the booking..."
                disabled={mutation.isPending}
              />
            </div>

            {/* Photo Picker */}
            <div>
              <div className="flex justify-between items-baseline mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Evidence Photos ({files.length} / 6)
                </label>
                <span className="text-[11px] text-ink-muted">
                  JPG, PNG, WebP up to 5 MB
                </span>
              </div>

              {/* Thumbnails grid */}
              {files.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {files.map((item, idx) => (
                    <div
                      key={item.previewUrl}
                      className="relative h-24 rounded border border-line overflow-hidden bg-paper-light group"
                    >
                      <Image
                        src={item.previewUrl}
                        alt={`Evidence photo ${idx + 1}`}
                        fill
                        sizes="120px"
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition-colors"
                        aria-label={`Remove photo ${idx + 1}`}
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {files.length < 6 && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="photo-upload"
                    disabled={mutation.isPending}
                  />
                  <label
                    htmlFor="photo-upload"
                    className="inline-flex items-center gap-2 rounded-md border border-dashed border-line bg-paper-light px-4 py-2.5 text-xs font-medium text-ink hover:border-ink-muted cursor-pointer transition-colors"
                  >
                    <svg
                      className="h-4 w-4 text-ink-muted"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <circle cx="12" cy="13" r="3" />
                    </svg>
                    <span>Upload photo or take picture</span>
                  </label>
                </div>
              )}

              {fileError && (
                <p className="mt-2 text-xs text-rose-700">{fileError}</p>
              )}
            </div>

            {mutation.isError && (
              <div className="rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                {mutation.error instanceof Error
                  ? mutation.error.message
                  : "Failed to submit issue. Please check the form and try again."}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="quiet"
                onClick={() => router.push(`/bookings/${id}`)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={mutation.isPending}
              >
                Submit Issue
              </Button>
            </div>
          </form>
        </div>
      </Container>
    </div>
  );
}

