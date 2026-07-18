import PusherServer from "pusher";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * Server-side Pusher — the ONE place we broadcast realtime events (live tracking + chat over a
 * single per-trip channel, PRD §7.6–7.7). SERVER ONLY: never import into a client component (it
 * carries the secret and Node deps).
 *
 * `null` when Pusher isn't configured, so the app degrades to the polling fallback (the hour-6
 * decision) instead of throwing. See lib/pusher/client.ts for the browser half.
 */
export const pusherServer =
  env.PUSHER_APP_ID && env.PUSHER_KEY && env.PUSHER_SECRET && env.PUSHER_CLUSTER
    ? new PusherServer({
        appId: env.PUSHER_APP_ID,
        key: env.PUSHER_KEY,
        secret: env.PUSHER_SECRET,
        cluster: env.PUSHER_CLUSTER,
        useTLS: true,
      })
    : null;

/**
 * Fire-and-forget broadcast. Never throws into the request path — a realtime hiccup must not fail
 * the write (the DB is the source of truth; the polling fallback still delivers within 4s).
 */
export async function pusherTrigger(
  channel: string,
  event: string,
  data: unknown,
): Promise<void> {
  if (!pusherServer) return;
  try {
    await pusherServer.trigger(channel, event, data);
  } catch (err) {
    logger.error("pusher trigger failed", { channel, event, err });
  }
}
