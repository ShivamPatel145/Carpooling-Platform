"use client";

import * as React from "react";
import { MapPin } from "lucide-react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useController } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import type { GeoPoint } from "@/features/ride/schema";

/**
 * A pragmatic geo-point picker for the hackathon demo: a labelled place with lat/lng. No paid
 * geocoder — instead a curated quick-pick list of common landmarks (so the demo "just works"),
 * plus manual lat/lng entry. Writes a GeoPoint ({ label, lat, lng }) into an RHF field. OSRM turns
 * the two points into a real road route server-side (see /api/ride).
 *
 * Swap the quick-pick list for a Nominatim/Mapbox autocomplete post-hackathon — the field's output
 * shape (GeoPoint) stays identical, so nothing downstream changes.
 */

/** Curated demo landmarks (Ahmedabad-area, matching the seed). Replace with live geocoding later. */
const QUICK_PICKS: GeoPoint[] = [
  { label: "Prahlad Nagar", lat: 23.0119, lng: 72.5107 },
  { label: "SG Highway (Bodakdev)", lat: 23.0369, lng: 72.5108 },
  { label: "GIFT City", lat: 23.1595, lng: 72.6854 },
  { label: "Sabarmati Riverfront", lat: 23.0561, lng: 72.5797 },
  { label: "Maninagar", lat: 22.9967, lng: 72.6018 },
  { label: "Gandhinagar Secretariat", lat: 23.2231, lng: 72.6503 },
  { label: "Vastrapur Lake", lat: 23.0395, lng: 72.5289 },
  { label: "Ahmedabad Airport (SVPIA)", lat: 23.0772, lng: 72.6347 },
];

export function LocationField<T extends FieldValues>({
  control,
  name,
  label,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
}) {
  const {
    field,
    fieldState: { error },
  } = useController({ control, name });

  const value = field.value as GeoPoint | undefined;
  const [open, setOpen] = React.useState(false);

  function set(partial: Partial<GeoPoint>) {
    const next: GeoPoint = {
      label: partial.label ?? value?.label ?? "",
      lat: partial.lat ?? value?.lat ?? 0,
      lng: partial.lng ?? value?.lng ?? 0,
    };
    field.onChange(next);
  }

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>

      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value?.label ?? ""}
          onChange={(e) => set({ label: e.target.value })}
          onFocus={() => setOpen(true)}
          placeholder="Search or pick a place…"
          className="pl-9"
          aria-label={label}
        />
      </div>

      {open && (
        <div className="rounded-md border bg-popover p-1 shadow-sm">
          <div className="grid gap-0.5 sm:grid-cols-2">
            {QUICK_PICKS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  set(p);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                  value?.label === p.label && "bg-accent text-accent-foreground",
                )}
              >
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                {p.label}
              </button>
            ))}
          </div>
          <div className="mt-1 flex items-center justify-end border-t px-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      )}

      {/* Manual lat/lng — folded away but available for precise pins. */}
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="number"
          step="any"
          inputMode="decimal"
          value={value?.lat ?? ""}
          onChange={(e) => set({ lat: Number(e.target.value) })}
          placeholder="Latitude"
          className="font-mono text-xs"
          aria-label={`${label} latitude`}
        />
        <Input
          type="number"
          step="any"
          inputMode="decimal"
          value={value?.lng ?? ""}
          onChange={(e) => set({ lng: Number(e.target.value) })}
          placeholder="Longitude"
          className="font-mono text-xs"
          aria-label={`${label} longitude`}
        />
      </div>

      {error?.message && <FormMessage>{error.message}</FormMessage>}
      {/* Nested lat/lng/label errors surface on the object itself. */}
      {typeof error === "object" && "label" in (error as object) && (
        <FormMessage>{(error as { label?: { message?: string } }).label?.message}</FormMessage>
      )}
    </FormItem>
  );
}
