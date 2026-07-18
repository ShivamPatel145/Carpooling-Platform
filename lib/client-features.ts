/**
 * CLIENT-SAFE feature flags. lib/env.ts reads process.env and validates server secrets, so it must
 * not be imported into client components. This module exposes only what the client legitimately
 * needs, via NEXT_PUBLIC_ vars (inlined at build time). Server code should still use lib/env.ts.
 *
 * Uploads: the UPLOADTHING_TOKEN is server-only, but the client needs to know whether to enable
 * the upload button. NEXT_PUBLIC_UPLOADS_ENABLED mirrors it (set in .env alongside the token).
 */
export const features = {
  uploads: process.env.NEXT_PUBLIC_UPLOADS_ENABLED === "true",
  /** realtime (Pusher) available on the client — else tracking/chat use polling only. */
  realtime: Boolean(process.env.NEXT_PUBLIC_PUSHER_KEY),
} as const;
