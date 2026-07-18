/**
 * Slice B — saved-place feature schema. ONE Zod source (db/schema/saved-place.ts), re-exported for
 * the API + form (generic-crud rule #2). Home/Office/custom labels power the autofill on Find/Offer.
 */
export {
  savedPlaceFormSchema,
  savedPlaceSelectSchema,
  type SavedPlace,
  type SavedPlaceFormValues,
} from "@/db/schema/saved-place";

/** Suggested quick labels (free-text field, these are just chips). */
export const QUICK_LABELS = ["Home", "Office", "Gym", "Airport"] as const;
