import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // StrictMode is OFF because react-leaflet v4.2.1 is not StrictMode-safe under React 18. Its
  // MapContainer creates the Leaflet map inside a ref callback that has NO detach cleanup, so
  // StrictMode's dev-only mount→unmount→remount double-invoke re-runs the ref on a DOM node that
  // Leaflet already stamped with `_leaflet_id`, throwing "Map container is already initialized."
  // The double-invoke is dev-only (it never runs in a production build), so this only affects the
  // dev experience; there is no clean per-component workaround in v4 (fixed upstream in v5/React 19).
  reactStrictMode: false,
  // Barrel-import optimizer. Without this, dev compile pulls each package's ENTIRE barrel module
  // graph into every one of the ~77 files that import from it (lucide-react alone is ~1,500 icon
  // modules) — the dominant "Compiling…" cost per route. Next rewrites `import { X } from "pkg"`
  // to the direct submodule path so only the used icons/components compile.
  experimental: {
    // Turbopack (`pnpm dev:turbo`) equivalent of the webpack `pg: false` client alias below:
    // keep node-postgres out of the browser bundle. Webpack dev (`pnpm dev`) still uses the
    // webpack() fn; only ONE compiler runs at a time, so the two configs never conflict.
    turbo: {
      resolveAlias: { pg: { browser: "./lib/empty-module.ts" } },
    },
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-dialog",
      "@radix-ui/react-select",
      "@radix-ui/react-popover",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
    ],
  },
  // @react-pdf/renderer is external (pure JS, Vercel-safe). It ships its OWN React reconciler, and
  // the trap is a dual-React-instance mismatch ("React error #31") — react-pdf (external) resolves
  // React from node_modules while Next bundles a second copy for the route. We render the PDF in an
  // isolated Node subprocess (lib/pdf/render.ts → scripts/render-pdf) so exactly one React instance
  // is in play, sidestepping the bundler entirely. Kept external here for correctness + Vercel safety.
  // pg (node-postgres) is the LOCAL-dev database driver (swapped in for Neon's serverless driver).
  // Keep it external so the server bundles it as a runtime require rather than trying to bundle its
  // dynamic node internals.
  serverExternalPackages: ["@react-pdf/renderer", "pg", "ws", "bufferutil", "utf-8-validate"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // The employee shell (a client component) imports nav.config.ts, which imports a VALUE
      // (roleHierarchy) from lib/permissions.ts — a shared file that top-level-imports @/auth →
      // @/db → pg (Node-only, needs fs/net/tls/util). Neon's serverless driver was browser-safe so
      // this graph bundled cleanly; node-postgres is not. permissions.ts only calls auth() inside
      // server-only guards, so we alias @/auth to an empty module in the CLIENT bundle: pg/db/env
      // never reach the browser, while permissions' pure exports (roleHierarchy, hasPermission…)
      // keep working. Server bundles (isServer) get the real driver. `db` is required lazily +
      // server-only (db/index.ts), so this only needs to stop webpack from BUNDLING pg for the browser.
      config.resolve.alias = { ...config.resolve.alias, pg: false };
    }
    return config;
  },
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
