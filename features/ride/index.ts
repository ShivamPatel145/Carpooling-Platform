/**
 * features/ride — the ride engine (Slice A): Offer, Find, Book, and the mode-switcher's history.
 * orgId-scoped queries (scopedWhere), OSRM route caching, and a concurrency-safe seat decrement.
 *
 *   schema.ts   → the ONE Zod schema set (re-exported from db/schema/ride + booking)
 *   hooks.ts    → TanStack Query hooks (offer, search, book, cancel) + toasts
 *   components/ → location-field, offer-form, ride-card, book-dialog, find-view, my-rides-view
 */
export { OfferRideForm } from "./components/offer-form";
export { FindView } from "./components/find-view";
export { MyRidesView } from "./components/my-rides-view";
export { RideCard } from "./components/ride-card";
export { BookDialog } from "./components/book-dialog";
export { LocationField } from "./components/location-field";
export * from "./hooks";
export * from "./schema";
