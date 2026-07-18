import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ourFileRouter } from "@/app/api/uploadthing/core";

/*
 * LOCKED TYPE SYSTEM — Space Grotesk (display) · IBM Plex Sans (body) · IBM Plex Mono (data).
 * next/font/google with font-display: swap and real fallbacks. See docs/design-standards.md §3.
 * DO NOT swap these faces — they are synced and published to Claude Design.
 */
const fontDisplay = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["500", "600", "700"],
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

const fontSans = IBM_Plex_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  fallback: ["ui-monospace", "SFMono-Regular", "monospace"],
});

export const metadata: Metadata = {
  // TODO(build-day): replace with the chosen product name + domain description.
  title: {
    default: "Operations Platform",
    template: "%s · Operations Platform",
  },
  description: "A professional operations platform.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable} h-full`}
    >
      <body className="min-h-full">
        <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
