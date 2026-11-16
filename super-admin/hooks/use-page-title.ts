"use client";

import { useEffect } from "react";
import { DASHBOARD_NAME } from "@/lib/constants";

export function usePageTitle(title?: string) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (title && title.trim().length > 0) {
      document.title = `${title.trim()} | ${DASHBOARD_NAME}`;
    } else {
      document.title = DASHBOARD_NAME;
    }
  }, [title]);
}
