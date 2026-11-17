import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import { DASHBOARD_NAME } from "@/lib/constants";
import { ServiceWorkerRegistration } from "@/components/common/service-worker-registration";
import { PwaInstallBanner } from "@/components/common/pwa-install-banner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: DASHBOARD_NAME,
    template: `%s | ${DASHBOARD_NAME}`,
  },
  description: "Agent and owner dashboard for vehicle listings and booking management.",
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: DASHBOARD_NAME,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1F5C4D",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;700&family=Public+Sans:wght@400;500;600&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-(--paper) text-(--ink)">
        <Providers>
          {children}
          <ServiceWorkerRegistration />
          <PwaInstallBanner />
        </Providers>
      </body>
    </html>
  );
}
