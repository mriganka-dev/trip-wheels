"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  OAUTH_CUSTOMER_ERROR_MESSAGES,
  DEFAULT_OAUTH_CUSTOMER_ERROR,
} from "@/lib/constants";

function OAuthErrorMessageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const errorCode = searchParams.get("error");
    if (!errorCode) {
      return;
    }

    const message =
      OAUTH_CUSTOMER_ERROR_MESSAGES[errorCode] || DEFAULT_OAUTH_CUSTOMER_ERROR;
    setErrorMessage(message);

    const current = new URLSearchParams(searchParams.toString());
    current.delete("error");
    const query = current.toString();
    const cleanUrl = query ? `${pathname}?${query}` : pathname;

    router.replace(cleanUrl, { scroll: false });
  }, [searchParams, pathname, router]);

  if (!errorMessage) {
    return null;
  }

  return (
    <div
      role="alert"
      className="mb-6 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-(--negative)"
    >
      {errorMessage}
    </div>
  );
}

export function OAuthErrorMessage() {
  return (
    <Suspense fallback={null}>
      <OAuthErrorMessageContent />
    </Suspense>
  );
}
