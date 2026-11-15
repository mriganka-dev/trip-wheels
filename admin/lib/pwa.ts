"use client";

const DISMISSAL_KEY = "pwa_install_dismissed_until";

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && Boolean((window.navigator as unknown as { standalone: boolean }).standalone))
  );
}

export function isIosSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua);
  const isWebkit = /WebKit/.test(ua);
  const isSafari = isIos && isWebkit && !/CriOS|FxiOS|OPiOS|mercury/i.test(ua);
  return isSafari && !isStandalone();
}

export function isInstallPromptDismissed(): boolean {
  if (typeof window === "undefined") return false;
  const dismissedUntil = localStorage.getItem(DISMISSAL_KEY);
  if (!dismissedUntil) return false;
  const time = parseInt(dismissedUntil, 10);
  return Date.now() < time;
}

export function dismissInstallPrompt(days = 14): void {
  if (typeof window === "undefined") return;
  const until = Date.now() + days * 24 * 60 * 60 * 1000;
  localStorage.setItem(DISMISSAL_KEY, until.toString());
}
