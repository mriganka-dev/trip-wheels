"use client";

import React, { useState } from "react";
import { EyeOff } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { hideReview } from "@/lib/api/issues";
import { formatDateTime } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";

export interface ReviewItemProps {
  id: string;
  reviewerName: string;
  rating: number;
  comment?: string;
  tags?: string[];
  createdAt?: string;
  isHidden?: boolean;
  onHiddenChange?: (hidden: boolean) => void;
}

export const ReviewModerationCard: React.FC<ReviewItemProps> = ({
  id,
  reviewerName,
  rating,
  comment,
  tags = [],
  createdAt,
  isHidden = false,
  onHiddenChange,
}) => {
  const [hideDialogOpen, setHideDialogOpen] = useState<boolean>(false);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const hideMutation = useMutation({
    mutationFn: () => hideReview(id, true),
    onSuccess: () => {
      showToast("Review hidden successfully", "brand");
      setHideDialogOpen(false);
      onHiddenChange?.(true);
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.verifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
    onError: (err: Error) => {
      showToast(err.message || "Failed to hide review", "negative");
    },
  });

  return (
    <div className="p-4 bg-surface border border-line rounded text-xs space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink">{reviewerName}</span>
          <span className="text-brand font-mono font-bold">{rating}/5</span>
          {createdAt && (
            <span className="text-ink-soft text-[11px]">
              {formatDateTime(createdAt)}
            </span>
          )}
        </div>
        {!isHidden && (
          <Button
            type="button"
            variant="quiet"
            size="sm"
            onClick={() => setHideDialogOpen(true)}
            className="text-ink-soft hover:text-negative text-xs"
          >
            <EyeOff className="w-3.5 h-3.5 mr-1" />
            Hide review
          </Button>
        )}
        {isHidden && (
          <span className="text-negative font-medium bg-[#FEF0ED] px-2 py-0.5 rounded text-[11px]">
            Hidden
          </span>
        )}
      </div>

      {comment && <p className="text-ink text-sm">{comment}</p>}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-1.5 py-0.5 bg-paper text-ink-soft rounded text-[10px]"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Hide Review Confirm Dialog */}
      <ConfirmDialog
        open={hideDialogOpen}
        onOpenChange={setHideDialogOpen}
        title="Hide Review"
        description="A hidden review disappears from public lists and from the averages. This action is recorded in the audit log."
        targetName={`Review by ${reviewerName}`}
        actionLabel="Hide Review"
        actionVariant="danger"
        requireNote={true}
        noteLabel="Reason for hiding"
        notePlaceholder="Explain why this review is being hidden..."
        isLoading={hideMutation.isPending}
        onConfirm={() => hideMutation.mutate()}
      />
    </div>
  );
};
