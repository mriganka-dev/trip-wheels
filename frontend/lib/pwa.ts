export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isIos(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) &&
    !(window as unknown as { MSStream?: unknown }).MSStream
  );
}

const PWA_DISMISS_KEY = "tw_pwa_dismissed_until";

export function isPwaPromptDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem(PWA_DISMISS_KEY);
    if (!stored) return false;
    const until = Number(stored);
    return Date.now() < until;
  } catch {
    return false;
  }
}

export function dismissPwaPrompt(days: number = 14): void {
  if (typeof window === "undefined") return;
  try {
    const until = Date.now() + days * 24 * 60 * 60 * 1000;
    localStorage.setItem(PWA_DISMISS_KEY, String(until));
  } catch {
    // Ignore storage errors
  }
}

