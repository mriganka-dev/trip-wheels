import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const hasAccessToken = request.cookies.has("accessToken");
  const hasRefreshToken = request.cookies.has("refreshToken");

  const isAuthenticated = hasAccessToken || hasRefreshToken;

  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    const destinationPath = request.nextUrl.pathname + request.nextUrl.search;
    loginUrl.searchParams.set("next", destinationPath);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/bookings/:path*",
    "/vehicles/:path*",
    "/schedule/:path*",
    "/verification/:path*",
    "/issues/:path*",
    "/reviews/:path*",
    "/reliability/:path*",
    "/notifications/:path*",
    "/profile/:path*",
    "/guide/:path*",
  ],
};
