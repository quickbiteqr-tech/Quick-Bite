// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import AuthListener from "@/components/AuthListener";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "QuickBiteQR | 1-Month Free Trial QR Ordering & POS for Indian Restaurants",
    template: "%s | QuickBiteQR"
  },
  description: "QuickBiteQR is a digital dining and POS system for Indian restaurants. Enjoy a 1-month free trial for seamless QR ordering, KDS, and direct UPI payments.",
  keywords: ["QR menu", "restaurant POS", "free trial POS", "direct UPI", "India", "digital dining", "KDS", "restaurant management"],
  alternates: {
    canonical: "https://quickbiteqr.co.in",
  },
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
    title: "QuickBiteQR - Start Your 1-Month Free Trial",
    description: "Seamlessly order, split bills, and pay via UPI directly from your table. No app required. Try free for 1 month.",
    url: "https://quickbiteqr.co.in",
    siteName: "QuickBiteQR",
    images: [
      {
        url: "https://quickbiteqr.co.in/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "QuickBiteQR - Scan, Order, Direct UPI Payment",
      }
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "QuickBiteQR | 1-Month Free Trial",
    description: "Upgrade your restaurant with QR ordering and direct UPI payments. Get your first month completely free.",
    images: ["https://quickbiteqr.co.in/og-image.jpg"],
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
        <AuthListener />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
