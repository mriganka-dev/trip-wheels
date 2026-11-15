"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Star } from "lucide-react";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { createReview } from "@/lib/api/reviews";
import type { Booking } from "@/types/booking";

interface ReviewCustomerDialogProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ReviewCustomerDialog({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: ReviewCustomerDialogProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const customerName = booking.customer?.fullName || "the customer";

  const mutation = useMutation({
    mutationFn: async () => {
      setErrorMessage(null);
      if (rating < 1 || rating > 5) {
        throw new Error("Please select a rating between 1 and 5 stars.");
      }
      return createReview(booking._id, {
        rating,
        comment: comment.trim() || undefined,
      });
    },
    onSuccess: () => {
      showToast("Customer review submitted successfully.", "brand");
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      onClose();
      onSuccess?.();
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || "Failed to submit customer review");
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        title={`Review ${customerName}`}
        description={`Booking ${booking.bookingCode}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="rounded border border-(--line) bg-(--surface-soft) p-3 text-xs text-(--ink-soft)">
            These reviews are visible only to the Admin team and to owners who receive that customer&apos;s request in the future.
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-wider font-medium text-(--ink-soft) mb-2">
              Rating *
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 text-(--ink-soft) hover:text-amber-500 transition-colors focus-visible:outline-2 focus-visible:outline-(--brand) rounded cursor-pointer"
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating
                        ? "fill-amber-500 text-amber-500"
                        : "text-zinc-300"
                    }`}
                  />
                </button>
              ))}
              <span className="text-sm font-semibold text-(--ink) ml-2">
                {rating} / 5
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-medium text-(--ink-soft) mb-1">
              Feedback & notes (optional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the customer's punctuality, vehicle care, and communication?"
              rows={4}
              maxLength={1000}
            />
            <p className="text-[11px] text-(--ink-soft) mt-1">
              {comment.length}/1000 characters
            </p>
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
              {mutation.isPending ? "Submitting..." : "Submit review"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
