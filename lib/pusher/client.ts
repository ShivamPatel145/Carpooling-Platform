"use client";

import PusherClient from "pusher-js";
import { features } from "@/lib/client-features";

/**
 * Browser Pusher client (singleton per tab). Authorizes private channels via /api/pusher/auth.
 * Returns `null` when realtime isn't configured — callers fall back to 4-second polling.
 */
let client: PusherClient | null = null;

export function getPusherClient(): PusherClient | null {
  if (!features.realtime) return null;
  if (client) return client;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  if (!key || !cluster) return null;

  client = new PusherClient(key, {
    cluster,
    authEndpoint: "/api/pusher/auth",
    forceTLS: true,
  });
  return client;
}
