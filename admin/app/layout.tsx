import type { Metadata, Viewport } from "next";
import { Fraunces, Public_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import { DASHBOARD_NAME } from "@/lib/constants";
import { ServiceWorkerRegistration } from "@/components/common/service-worker-registration";
import { PwaInstallBanner } from "@/components/common/pwa-install-banner";
import "./globals.css";

const displayFont = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700"],
});

const bodyFont = Public_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

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
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} h-full antialiased`}
    >
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
