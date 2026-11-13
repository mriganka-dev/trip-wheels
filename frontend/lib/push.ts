import { apiClient } from "@/lib/api/client";
import { isIos, isStandalone } from "@/lib/pwa";

export type PushStatus = "on" | "off" | "blocked" | "not_supported";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;

  // On iOS, push is only supported when added to Home Screen (standalone)
  if (isIos() && !isStandalone()) {
    return false;
  }

  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function getPushStatus(): Promise<PushStatus> {
  if (!isPushSupported()) {
    return "not_supported";
  }

  if (Notification.permission === "denied") {
    return "blocked";
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub && Notification.permission === "granted") {
      return "on";
    }
  } catch {
    // Fallback to off
  }

  return "off";
}

export async function subscribeToPush(): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) {
    if (isIos() && !isStandalone()) {
      return {
        success: false,
        error:
          "On iPhone, push notifications require adding Trip Wheels to your Home Screen first.",
      };
    }
    return { success: false, error: "Push notifications are not supported by your browser." };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return {
        success: false,
        error: "Notification permission was not granted. Please enable notifications in your browser settings.",
      };
    }

    // Fetch VAPID public key
    const { publicKey } = await apiClient<{ publicKey: string }>("/notifications/vapid-public-key", {
      method: "GET",
    });

    if (!publicKey) {
      return { success: false, error: "Server did not provide a valid push notification key." };
    }

    const registration = await navigator.serviceWorker.ready;
    const existingSub = await registration.pushManager.getSubscription();

    let subscription = existingSub;
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    const subJson = subscription.toJSON();

    // Send subscription to backend
    await apiClient("/notifications/push-subscriptions", {
      method: "POST",
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subJson.keys?.p256dh,
          auth: subJson.keys?.auth,
        },
        userAgent: navigator.userAgent,
        platform: navigator.platform,
      }),
    });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to enable push notifications.",
    };
  }
}

export async function unsubscribeFromPush(): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) {
    return { success: true };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Remove from backend
      try {
        await apiClient("/notifications/push-subscriptions", {
          method: "DELETE",
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      } catch {
        // Continue even if backend call fails
      }

      await subscription.unsubscribe();
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to disable push notifications.",
    };
  }
}

// Quiet background sync after login
export async function syncPushSubscriptionQuietly(): Promise<void> {
  if (!isPushSupported()) return;
  if (Notification.permission !== "granted") return;

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const subJson = sub.toJSON();
      await apiClient("/notifications/push-subscriptions", {
        method: "POST",
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: subJson.keys?.p256dh,
            auth: subJson.keys?.auth,
          },
          userAgent: navigator.userAgent,
          platform: navigator.platform,
        }),
      });
    }
  } catch {
    // Fail silently in background
  }
}
