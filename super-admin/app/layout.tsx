import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import { DASHBOARD_NAME } from "@/lib/constants";
import { getAppUrl } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
  title: {
    default: DASHBOARD_NAME,
    template: `%s | ${DASHBOARD_NAME}`,
  },
  description: "Operations console for the Trip Wheels team.",
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;700&family=Public+Sans:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
