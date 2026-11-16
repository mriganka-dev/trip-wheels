"use client";

import React, { useState } from "react";
import { Dialog, DialogContent } from "./dialog";
import { Button, type ButtonVariant } from "./button";
import { Field } from "./field";
import { Textarea } from "./textarea";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  targetName?: string;
  actionLabel?: string;
  actionVariant?: ButtonVariant;
  requireNote?: boolean;
  noteLabel?: string;
  notePlaceholder?: string;
  isLoading?: boolean;
  onConfirm: (note: string) => void | Promise<void>;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  targetName,
  actionLabel = "Confirm",
  actionVariant = "primary",
  requireNote = false,
  noteLabel = "Note or reason",
  notePlaceholder = "Enter reason for this action",
  isLoading = false,
  onConfirm,
}) => {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (requireNote && note.trim().length === 0) {
      setError("A written note is required for this action");
      return;
    }
    setError(null);
    await onConfirm(note.trim());
    setNote("");
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setNote("");
      setError(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent title={title} showClose={!isLoading}>
        <div className="space-y-4">
          <p className="text-sm text-ink">{description}</p>

          {targetName && (
            <div className="bg-paper p-3 rounded border border-line">
              <span className="text-xs text-ink-soft uppercase font-medium">Target</span>
              <p className="text-sm font-semibold text-ink mt-0.5">{targetName}</p>
            </div>
          )}

          <Field
            label={noteLabel}
            required={requireNote}
            error={error || undefined}
            hint={requireNote ? "Required for the audit trail" : "Optional reason"}
          >
            <Textarea
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (error) setError(null);
              }}
              placeholder={notePlaceholder}
              rows={3}
              hasError={Boolean(error)}
              disabled={isLoading}
            />
          </Field>

          <p className="text-xs text-ink-soft italic">
            This action is recorded in the audit log.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
            <Button
              type="button"
              variant="quiet"
              onClick={() => handleClose(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={actionVariant}
              onClick={handleConfirm}
              isLoading={isLoading}
            >
              {actionLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
