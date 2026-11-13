export function getSafeRedirectUrl(nextUrl: string | null | undefined): string {
  if (!nextUrl) {
    return "/";
  }

  // Ensure path is internal and does not perform protocol-relative or external redirects
  if (nextUrl.startsWith("/") && !nextUrl.startsWith("//") && !nextUrl.startsWith("/\\")) {
    return nextUrl;
  }

  return "/";
}

