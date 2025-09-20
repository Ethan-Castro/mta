import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MTA ACE Insight Dashboard",
  description: "Clear insights on ACE violations, speeds, and policy impact",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
