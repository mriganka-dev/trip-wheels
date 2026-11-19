"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { isPushSupported, syncPushSubscriptionIfGranted } from "@/lib/push";

export function ServiceWorkerRegistration() {
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      if ("caches" in window) {
        caches.keys().then((names) => {
          for (const name of names) {
            caches.delete(name);
          }
        });
      }
      return;
    }

    const registerSW = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          // If update is found, activate immediately
          registration.addEventListener("updatefound", () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener("statechange", () => {
                if (
                  installingWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New update available, auto activate
                  installingWorker.postMessage({ type: "SKIP_WAITING" });
                }
              });
            }
          });

          // If user is authenticated and permission was already granted,
          // quietly sync or restore the subscription on backend
          if (user && isPushSupported() && Notification.permission === "granted") {
            syncPushSubscriptionIfGranted().catch(() => {
              // Non-blocking sync
            });
          }
        })
        .catch(() => {
          // Registration failed (e.g. unsupported environment or private mode)
        });
    };

    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW);
      return () => window.removeEventListener("load", registerSW);
    }
  }, [user]);

  return null;
}
