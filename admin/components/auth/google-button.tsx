"use client";

import React, { useState } from "react";
import clsx from "clsx";
import { getSafeRedirectUrl } from "@/lib/safe-redirect";

export interface GoogleButtonProps {
  app?: "customer" | "agent";
  mode: "login" | "register";
  type?: "agent" | "individual";
  next?: string | null;
  disabled?: boolean;
  className?: string;
}

export function GoogleButton({
  app = "agent",
  mode,
  type,
  next,
  disabled = false,
  className,
}: GoogleButtonProps) {
  const [hasLogoError, setHasLogoError] = useState(false);

  const safeNext = next ? getSafeRedirectUrl(next) : null;
  const params = new URLSearchParams();
  params.set("app", app);
  params.set("mode", mode);
  if (mode === "register" && type) {
    params.set("type", type);
  }
  if (safeNext && safeNext !== "/") {
    params.set("next", safeNext);
  }

  const href = `/api/v1/auth/google?${params.toString()}`;

  const content = (
    <>
      {!hasLogoError && (
        <img
          src="/images/google-g.svg"
          alt=""
          width={18}
          height={18}
          onError={() => setHasLogoError(true)}
          className="shrink-0"
        />
      )}
      <span>Continue with Google</span>
    </>
  );

  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className={clsx(
          "inline-flex items-center justify-center gap-3 w-full min-h-[44px] px-4 py-2 text-sm font-medium rounded-md border border-(--line) bg-(--surface) text-(--ink-soft) opacity-60 cursor-not-allowed select-none",
          className
        )}
      >
        {content}
      </span>
    );
  }

  return (
    <a
      href={href}
      className={clsx(
        "inline-flex items-center justify-center gap-3 w-full min-h-[44px] px-4 py-2 text-sm font-medium rounded-md border border-(--line) bg-(--surface) text-(--ink) transition-colors hover:border-(--ink-soft) hover:bg-(--paper) focus-visible:outline-2 focus-visible:outline-(--brand) focus-visible:outline-offset-2",
        className
      )}
    >
      {content}
    </a>
  );
}
