import React from "react";
import type { Metadata } from "next";

import "./globals.css"
import NextTopLoader from "nextjs-toploader";
import { ThemeProvider } from "@/components/Themeprovider";
import { Providers } from "@/components/providers";
import { OfflineBanner } from "@/app/components/shared/offline-banner";

export const metadata: Metadata = {
  title: "Trip Wheels Super Admin",
  description: "Trip Wheels Marketplace Operations & Super Admin Console.",
   openGraph: {
    title: "Trip Wheels Super Admin",
    description: "Trip Wheels Marketplace Operations & Super Admin Console.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (

    <html lang="en" suppressHydrationWarning
      data-color-theme="CUSTOM_THEME"
      data-layout="vertical"
      data-boxed-layout="boxed"
      data-sidebar-type="true"
      data-card-shadow="false"
      className="style-lyra"
    >
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      </head>
      <body className="font-sans antialiased" style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <NextTopLoader color="var(--primary)" showSpinner={false} />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          <Providers>
            {children}
            <OfflineBanner />
          </Providers>
        </ThemeProvider>
      </body>
    </html>

  );
}
