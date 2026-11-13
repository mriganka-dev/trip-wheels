import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tripwheels.in";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/destinations",
          "/destinations/*",
          "/vehicles/*",
          "/how-it-works",
          "/help",
          "/terms",
          "/privacy",
        ],
        disallow: [
          "/api/*",
          "/book/*",
          "/bookings/*",
          "/issues/*",
          "/notifications/*",
          "/profile/*",
          "/login",
          "/register",
          "/verify-email",
          "/forgot-password",
          "/reset-password",
          "/non-customer",
          "/offline",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

