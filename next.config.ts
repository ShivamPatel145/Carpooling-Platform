import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // @react-pdf/renderer is external (pure JS, Vercel-safe). It ships its OWN React reconciler, and
  // the trap is a dual-React-instance mismatch ("React error #31") — react-pdf (external) resolves
  // React from node_modules while Next bundles a second copy for the route. We render the PDF in an
  // isolated Node subprocess (lib/pdf/render.ts → scripts/render-pdf) so exactly one React instance
  // is in play, sidestepping the bundler entirely. Kept external here for correctness + Vercel safety.
  serverExternalPackages: ["@react-pdf/renderer"],
  images: {
    remotePatterns: [
      // UploadThing-served assets
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "*.ufs.sh" },
      // Google account avatars (OAuth)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
