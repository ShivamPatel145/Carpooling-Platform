/**
 * Slice B — trip feature schema. ONE Zod source per entity (generic-crud rule #2): the validation
 * schemas + enums live in db/schema/trip.ts; this re-exports them for the API + client, and adds the
 * enriched view-model the API returns (joined ride + counterparty + the caller's role) plus the
 * lifecycle state machine that drives BOTH server validation and the UI's action affordances.
 */
export {
  tripStatusEnum,
  tripLocationSchema,
  tripTransitionSchema,
  tripSelectSchema,
  type Trip,
  type TripStatus,
  type TripLocationValues,
  type TripTransitionValues,
} from "@/db/schema/trip";

import { tripStatusEnum, type TripStatus } from "@/db/schema/trip";
import type { GeoPoint } from "@/db/schema/ride";
import { humanize } from "@/lib/utils";

export type { GeoPoint };

/** Status options for the faceted filter / any status select. */
export const tripStatusOptions = tripStatusEnum.enumValues.map((value) => ({
  value,
  label: humanize(value),
}));

/** Which side of the trip the current user is on. */
export type TripRole = "driver" | "passenger";

/** Statuses where live tracking is active (driver emits, passenger follows). */
export const LIVE_STATUSES: readonly TripStatus[] = ["started", "in_progress"] as const;
export const isLiveStatus = (s: TripStatus): boolean => LIVE_STATUSES.includes(s);

/**
 * State machine (PRD §7.5). `completed` is transient: completing hands off to payment, so the
 * transition endpoint auto-advances completed → payment_pending (the B→C seam). payment_completed
 * is Slice C's to set once paid. EITHER party (driver or passenger) can mark the ride complete, so a
 * `completed` edge exists from booked/started/in_progress.
 */
export const TRIP_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  booked: ["started", "completed"],
  started: ["in_progress", "completed"],
  in_progress: ["completed"],
  completed: ["payment_pending"],
  payment_pending: ["payment_completed"],
  payment_completed: [],
};

/**
 * Transitions ONLY the driver may initiate (starting / advancing the drive). Completion is
 * deliberately NOT here — both the driver and the passenger can mark the ride complete.
 * payment_completed is passenger/payment-initiated (Slice C).
 */
export const DRIVER_TRANSITIONS: readonly TripStatus[] = ["started", "in_progress", "payment_pending"] as const;

export interface TripParticipant {
  id: string;
  name: string | null;
  phone: string | null;
  seatsBooked?: number;
}

/**
 * The enriched trip the API returns (list + detail). Numeric/timestamp columns are serialized to
 * strings (Drizzle `numeric` → string; timestamps → ISO). `routeGeoJSON` + full `passengers` are
 * populated on detail; the list keeps `routeGeoJSON` null to stay light.
 */
export interface TripView {
  id: string;
  rideId: string;
  status: TripStatus;
  /** the caller's role in THIS trip */
  role: TripRole;
  origin: GeoPoint;
  destination: GeoPoint;
  departAt: string;
  farePerSeat: string;
  /** the caller's own booking (passenger view) — id + fare, drives the "Pay now" link (Slice C) */
  bookingId: string | null;
  fareAmount: string | null;
  seatsBooked: number | null;
  distanceKm: string | null;
  durationMin: number | null;
  etaMin: number | null;
  driverLat: string | null;
  driverLng: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  vehicleLabel: string | null;
  driver: TripParticipant;
  passengers: TripParticipant[];
  /** the OTHER party, for call/chat: driver → first passenger, passenger → driver */
  counterparty: TripParticipant | null;
  routeGeoJSON: unknown | null;
}

/** Location ping broadcast/polled during live tracking. */
export interface TripLocationPing {
  lat: number;
  lng: number;
  etaMin: number | null;
  status: TripStatus;
  at: string;
}
