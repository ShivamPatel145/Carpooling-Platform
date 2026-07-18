/**
 * Realtime channel + event names — the ONE place they're defined, shared by server (broadcast) and
 * client (subscribe). PRD §7.6–7.7: a SINGLE private channel per trip carries BOTH live tracking and
 * chat (one realtime system, not two). Private so only trip participants — authorized in
 * app/api/pusher/auth — can subscribe. Pure module (no deps): safe on client and server.
 */

/** `private-trip-<uuid>` — the per-trip channel. */
export const tripChannel = (tripId: string) => `private-trip-${tripId}`;

/** Recover the tripId from a channel name (used by the auth endpoint to scope the check). */
export function tripIdFromChannel(channel: string): string | null {
  const m = /^private-trip-([0-9a-fA-F-]{36})$/.exec(channel);
  return m ? m[1]! : null;
}

/** Events broadcast on the trip channel. */
export const PUSHER_EVENTS = {
  /** driver location ping — { lat, lng, etaMin, status, at } */
  location: "location",
  /** new chat message — the serialized message row */
  message: "message",
  /** lifecycle status change — { status } */
  status: "status",
} as const;
