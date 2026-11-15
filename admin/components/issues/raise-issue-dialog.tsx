"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Trash2, UploadCloud } from "lucide-react";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { raiseIssue } from "@/lib/api/issues";
import { getReceivedBookings } from "@/lib/api/bookings";
import { queryKeys } from "@/lib/query-keys";

interface RaiseIssueDialogProps {
  bookingId?: string;
  bookingCode?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ISSUE_TYPE_OPTIONS = [
  { value: "customer_damage", label: "Customer caused vehicle damage" },
  { value: "late_return", label: "Customer returned vehicle late" },
  { value: "customer_no_show", label: "Customer did not show up for pickup" },
  { value: "misconduct", label: "Customer misconduct or abusive behavior" },
  { value: "not_as_promised", label: "Other dispute or issue" },
];

export function RaiseIssueDialog({
  bookingId: propBookingId,
  bookingCode: propBookingCode,
  isOpen,
  onClose,
  onSuccess,
}: RaiseIssueDialogProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [selectedBookingId, setSelectedBookingId] = useState(propBookingId || "");
  const [issueType, setIssueType] = useState("customer_damage");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If no bookingId provided, load recent bookings for selection
  const { data: bookingsData } = useQuery({
    queryKey: queryKeys.bookings.received({ limit: 30 }),
    queryFn: () => getReceivedBookings({ limit: 30 }),
    enabled: isOpen && !propBookingId,
  });

  const recentBookings = bookingsData?.items || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);

    if (files.length + selected.length > 6) {
      setErrorMessage("You can attach at most 6 photos.");
      return;
    }

    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    for (const file of selected) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage(`Photo ${file.name} exceeds the 5 MB limit.`);
        return;
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setErrorMessage(`File ${file.name} must be a JPG, PNG, or WebP image.`);
        return;
      }
      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }

    setErrorMessage(null);
    setFiles((prev) => [...prev, ...validFiles]);
    setFilePreviews((prev) => [...prev, ...validPreviews]);
  };

  const handleRemoveFile = (index: number) => {
    URL.revokeObjectURL(filePreviews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      setErrorMessage(null);
      const targetId = propBookingId || selectedBookingId;
      if (!targetId) {
        throw new Error("Please select a booking to report this issue for.");
      }
      if (!description.trim() || description.trim().length < 5) {
        throw new Error("Please describe what happened (at least 5 characters).");
      }

      const formData = new FormData();
      formData.append("type", issueType);
      formData.append("description", description.trim());
      files.forEach((file) => {
        formData.append("evidence", file);
      });

      return raiseIssue(targetId, formData);
    },
    onSuccess: () => {
      showToast("Issue report submitted for admin review.", "brand");
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      onClose();
      onSuccess?.();
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || "Failed to submit issue");
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        title="Report an issue"
        description="Describe what happened and add photos. Our team will review it."
        className="max-w-lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4"
        >
          {errorMessage && (
            <div className="flex items-start gap-2 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!propBookingId && (
            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-(--ink-soft) mb-1">
                Select booking *
              </label>
              <Select
                value={selectedBookingId}
                onChange={(e) => setSelectedBookingId(e.target.value)}
                required
              >
                <option value="">Choose a booking</option>
                {recentBookings.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.bookingCode} - {b.vehicle.brand} {b.vehicle.model} ({b.customer?.fullName || "Customer"})
                  </option>
                ))}
              </Select>
            </div>
          )}

          {propBookingCode && (
            <div className="rounded border border-(--line) bg-(--surface-soft) p-3 text-xs text-(--ink-soft)">
              Reporting for booking: <strong>{propBookingCode}</strong>
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-wider font-medium text-(--ink-soft) mb-1">
              Issue type *
            </label>
            <Select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
            >
              {ISSUE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-medium text-(--ink-soft) mb-1">
              Description *
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide clear details of what happened, dates, and any relevant facts"
              rows={4}
              maxLength={2000}
              required
            />
            <p className="text-[11px] text-(--ink-soft) mt-1">
              {description.length}/2000 characters
            </p>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-medium text-(--ink-soft) mb-1">
              Photos & evidence (up to 6, max 5 MB each)
            </label>

            {filePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {filePreviews.map((preview, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded border border-(--line) overflow-hidden group bg-(--surface-soft)"
                  >
                    <Image
                      src={preview}
                      alt={`Evidence ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded p-1 hover:bg-black/80 transition-colors"
                      aria-label="Remove photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {files.length < 6 && (
              <label className="flex flex-col items-center justify-center p-4 border border-dashed border-(--line) rounded-md cursor-pointer hover:bg-(--surface-soft) transition-colors text-center">
                <UploadCloud className="w-5 h-5 text-(--ink-soft) mb-1" />
                <span className="text-xs font-medium text-(--brand)">
                  Add photo
                </span>
                <span className="text-[10px] text-(--ink-soft) mt-0.5">
                  JPG, PNG or WebP up to 5 MB
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <DialogFooter className="mt-6 flex flex-col sm:flex-row justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-(--brand) hover:bg-(--brand-hover) text-white"
            >
              {mutation.isPending ? "Submitting..." : "Submit issue"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
