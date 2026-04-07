import { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";

export const metadata: Metadata = {
  title: "Pulseflow",
  description: "Premium async document workflow with live processing visibility"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className="bg-appBg text-appText antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
