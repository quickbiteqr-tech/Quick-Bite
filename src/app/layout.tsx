// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

// Client-only component
import AuthListener from "@/components/AuthListener";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "QuickBiteQR - Zero Commission Digital Dining",
  description: "Seamlessly order, split bills, and pay via UPI directly from your table. No app required.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "QuickBiteQR",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "QuickBiteQR - Zero Commission Digital Dining",
    description: "Seamlessly order, split bills, and pay via UPI directly from your table. No app required.",
    url: "https://quickbiteqr.co.in",
    siteName: "QuickBiteQR",
    images: [
      {
        url: "https://quickbiteqr.co.in/og-image.jpg", // Create this image and place in public/og-image.jpg
        width: 1200,
        height: 630,
        alt: "QuickBiteQR - Scan, Order, Pay",
      }
    ],
    locale: "en_IN",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={inter.className}>
        {/* Client-only auth state listener */}
        <AuthListener />

        {/* Main app content */}
        {children}
        <Analytics />
      </body>
    </html>
  );
}
