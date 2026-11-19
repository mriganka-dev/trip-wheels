import type { Metadata, Viewport } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { UnverifiedEmailBanner } from "@/components/auth/unverified-banner";
import { SwRegister } from "@/components/pwa/sw-register";
import { InstallBanner } from "@/components/pwa/install-banner";
import { Providers } from "@/components/providers";
import { APP_NAME } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME}: bike and car rental at your destination`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    "Rent bikes and cars directly from verified rental shops and local owners at your travel destination across India.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
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
          <SwRegister />
          <Header />
          <UnverifiedEmailBanner />
          <div className="flex-1 pb-16 md:pb-0">{children}</div>
          <Footer />
          <MobileTabBar />
          <InstallBanner />
        </Providers>
      </body>
    </html>
  );
}
