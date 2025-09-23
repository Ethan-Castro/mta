import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import GlobalHeader from "@/components/GlobalHeader";
import GlobalScopeBar from "@/components/GlobalScopeBar";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <div className="flex min-h-screen flex-col bg-background text-foreground">
            <GlobalHeader />
            <GlobalScopeBar />
            <main className="flex-1 pb-8 pt-4 sm:pb-12 sm:pt-6 lg:pt-8 overflow-x-hidden">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
