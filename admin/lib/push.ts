"use client";

import { apiClient } from "./api/client";

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getPushPermissionState(): "granted" | "denied" | "default" | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

export async function fetchVapidPublicKey(): Promise<string> {
  const res = await apiClient<{ publicKey: string }>("/notifications/vapid-public-key");
  return res.publicKey;
}

export async function sendTestNotification(): Promise<void> {
  return apiClient<void>("/notifications/test", {
    method: "POST",
  });
}

export async function confirmTestNotification(): Promise<void> {
  return apiClient<void>("/notifications/test/confirm", {
    method: "POST",
  });
}

export async function subscribeToPush(): Promise<PushSubscription> {
  if (!isPushSupported()) {
    throw new Error("Push notifications are not supported on this browser.");
  }

  // Request permission
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(
      permission === "denied"
        ? "Push notifications were blocked. Please enable permissions in your browser settings."
        : "Notification permission was dismissed."
    );
  }

  const registration = await navigator.serviceWorker.ready;
  const vapidKey = await fetchVapidPublicKey();

  if (!vapidKey) {
    throw new Error("VAPID public key is not configured on the server.");
  }

  const convertedVapidKey = urlBase64ToUint8Array(vapidKey);

  // Subscribe with PushManager
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedVapidKey as BufferSource,
  });

  const subJson = subscription.toJSON();

  if (!subscription.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
    throw new Error("Failed to generate valid push subscription keys.");
  }

  // Save subscription to backend
  await apiClient("/notifications/push-subscriptions", {
    method: "POST",
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
      },
      userAgent: navigator.userAgent,
      platform: navigator.platform,
    }),
  });

  return subscription;
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    try {
      await apiClient("/notifications/push-subscriptions", {
        method: "DELETE",
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });
    } catch {
      // Continue to unsubscribe locally even if server remove fails
    }
    await subscription.unsubscribe();
  }
}

export async function syncPushSubscriptionIfGranted(): Promise<void> {
  if (!isPushSupported()) return;
  if (Notification.permission !== "granted") return;

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const vapidKey = await fetchVapidPublicKey();
      if (!vapidKey) return;
      const convertedVapidKey = urlBase64ToUint8Array(vapidKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as BufferSource,
      });
    }

    const subJson = subscription.toJSON();
    if (subscription.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
      await apiClient("/notifications/push-subscriptions", {
        method: "POST",
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subJson.keys.p256dh,
            auth: subJson.keys.auth,
          },
          userAgent: navigator.userAgent,
          platform: navigator.platform,
        }),
      });
    }
  } catch {
    // Non-blocking quiet sync
  }
}
