/**
 * Root Layout
 *
 * The main layout component that wraps all pages in the application.
 * Provides authentication context, demo mode banner, and global styling.
 *
 * @module app/layout
 */

import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/components/layout/auth-provider";
import { DemoBanner } from "@/components/layout/demo-banner";
import { NavHeader } from "@/components/layout/nav-header";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

/**
 * Inter font for body text.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

/**
 * JetBrains Mono font for code/monospace.
 */
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

/**
 * Page metadata.
 */
export const metadata: Metadata = {
  title: {
    default: "AutoQuote AI - Get Repair Quotes Fast",
    template: "%s | AutoQuote AI",
  },
  description:
    "AI-powered auto repair quote comparison. Upload a photo, and our AI calls multiple shops simultaneously to get you the best quotes.",
  keywords: [
    "auto repair",
    "car repair",
    "repair quotes",
    "body shop",
    "AI",
    "quote comparison",
  ],
  authors: [{ name: "AutoQuote AI" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "AutoQuote AI",
    title: "AutoQuote AI - Get Repair Quotes Fast",
    description:
      "AI-powered auto repair quote comparison. Get quotes from multiple shops in minutes.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * Viewport configuration.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#302b63",
};

/**
 * Root layout component.
 *
 * @param children - Page content
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased gradient-bg min-h-screen`}
      >
        <AuthProvider>
          {/* Demo Mode Banner - shown when NEXT_PUBLIC_DEMO_MODE=true */}
          <DemoBanner />

          {/* Navigation Header */}
          <NavHeader />

          {/* Page Content - add padding for demo banner and header */}
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>

          {/* Toast Notifications */}
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}
