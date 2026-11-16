"use client";

import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { clsx } from "clsx";

export const MenuSheet = DialogPrimitive.Root;
export const MenuSheetTrigger = DialogPrimitive.Trigger;

export interface MenuSheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: "left" | "right";
  title?: string;
}

export const MenuSheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  MenuSheetContentProps
>(({ className, children, side = "left", title = "Navigation menu", ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40 transition-opacity" />
    <DialogPrimitive.Content
      ref={ref}
      className={clsx(
        "fixed inset-y-0 z-50 w-72 bg-surface p-6 border-line shadow-sm focus:outline-none flex flex-col justify-between overflow-y-auto",
        side === "left" ? "left-0 border-r" : "right-0 border-l",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
        <DialogPrimitive.Title className="text-base font-semibold text-ink">
          {title}
        </DialogPrimitive.Title>
        <DialogPrimitive.Close
          aria-label="Close menu"
          className="rounded p-1 text-ink-soft hover:text-ink hover:bg-brand-tint focus-visible:outline-2 focus-visible:outline-brand"
        >
          <X className="h-5 w-5" />
        </DialogPrimitive.Close>
      </div>
      <div className="flex-1">{children}</div>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
MenuSheetContent.displayName = "MenuSheetContent";
