import type { Metadata } from "next";
import { Suspense } from "react";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "../stack/server";
import { Geist, Geist_Mono } from "next/font/google";
import GlobalHeader from "@/components/GlobalHeader";
import MarketTickerBar from "@/components/MarketTickerBar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { logEnvironmentStatus } from "@/lib/env-validation";
import ConditionalTicker from "@/components/ConditionalTicker";
import "./globals.css";

// Validate environment variables during development
if (process.env.NODE_ENV === "development") {
  logEnvironmentStatus();
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MTA ACE Insight Dashboard",
  description: "Clear insights on ACE violations, speeds, and policy impact",
  icons: { icon: "/favicon.ico" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}><StackProvider app={stackServerApp}><StackTheme>
        <ThemeProvider>
          <div className="flex min-h-screen flex-col bg-background text-foreground">
            <Suspense fallback={<div className="border-b border-border/60 bg-background/85 px-4 py-3 text-sm text-foreground/60 sm:px-6">Loading workspace…</div>}>
              <GlobalHeader />
            </Suspense>
            <Suspense fallback={<div className="border-b border-border/60 bg-background/85 px-4 py-2 text-sm text-foreground/60 sm:px-6">Loading ticker…</div>}>
              <ConditionalTicker />
            </Suspense>
            <main className="flex-1 pb-8 pt-2 sm:pb-12 sm:pt-3 lg:pt-4 overflow-x-hidden">{children}</main>
          </div>
        </ThemeProvider>
      </StackTheme></StackProvider></body>
    </html>
  );
}
