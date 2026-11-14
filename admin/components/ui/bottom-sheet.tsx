"use client";

import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import clsx from "clsx";

export const BottomSheet = DialogPrimitive.Root;
export const BottomSheetTrigger = DialogPrimitive.Trigger;
export const BottomSheetClose = DialogPrimitive.Close;

export function BottomSheetContent({
  children,
  className,
  title,
  description,
  ...props
}: DialogPrimitive.DialogContentProps & {
  title?: string;
  description?: string;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-150" />
      <DialogPrimitive.Content
        className={clsx(
          "fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-lg border-t border-(--line) bg-(--surface) p-6 text-(--ink) shadow-sm",
          "md:inset-auto md:left-[50%] md:top-[50%] md:bottom-auto md:w-full md:max-w-lg md:translate-x-[-50%] md:translate-y-[-50%] md:rounded-md md:border",
          "transition-all duration-150 focus:outline-hidden",
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {title && (
              <DialogPrimitive.Title className="text-lg font-semibold font-display text-(--ink)">
                {title}
              </DialogPrimitive.Title>
            )}
            {description && (
              <DialogPrimitive.Description className="text-sm text-(--ink-soft) mt-1">
                {description}
              </DialogPrimitive.Description>
            )}
          </div>
          <DialogPrimitive.Close
            className="rounded p-1 text-(--ink-soft) hover:text-(--ink) focus-visible:outline-2 focus-visible:outline-(--brand) min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Close sheet"
          >
            <X className="w-5 h-5" />
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
