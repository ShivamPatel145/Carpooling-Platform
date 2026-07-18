"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TextField } from "@/components/form";
import { toast } from "@/hooks/use-toast";
import {
  QUICK_LABELS,
  savedPlaceFormSchema,
  type SavedPlace,
  type SavedPlaceFormValues,
} from "@/features/saved-place/schema";
import { useCreateSavedPlace, useUpdateSavedPlace } from "@/features/saved-place/hooks";

/** Create/edit a saved place. Shared Zod schema (same object the API validates). "Use my location"
 *  fills lat/lng from the browser's geolocation so the user rarely types coordinates by hand. */
export function SavedPlaceForm({ initial, onDone }: { initial?: SavedPlace; onDone?: () => void }) {
  const isEdit = Boolean(initial);
  const create = useCreateSavedPlace();
  const update = useUpdateSavedPlace(initial?.id ?? "");
  const pending = create.isPending || update.isPending;

  const form = useForm<SavedPlaceFormValues>({
    resolver: zodResolver(savedPlaceFormSchema),
    defaultValues: {
      label: initial?.label ?? "",
      lat: initial ? Number(initial.lat) : 0,
      lng: initial ? Number(initial.lng) : 0,
      address: initial?.address ?? "",
    },
  });

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      toast({ variant: "destructive", title: "This device has no geolocation" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        form.setValue("lat", Number(p.coords.latitude.toFixed(7)), { shouldValidate: true });
        form.setValue("lng", Number(p.coords.longitude.toFixed(7)), { shouldValidate: true });
        toast({ variant: "success", title: "Location filled in" });
      },
      () => toast({ variant: "destructive", title: "Couldn't read your location" }),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function onSubmit(values: SavedPlaceFormValues) {
    if (isEdit) await update.mutateAsync(values);
    else {
      await create.mutateAsync(values);
      form.reset();
    }
    onDone?.();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-2">
          <TextField control={form.control} name="label" label="Label" placeholder="Home, Office, Gym…" />
          <div className="flex flex-wrap gap-1.5">
            {QUICK_LABELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => form.setValue("label", l, { shouldValidate: true })}
                className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground"
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <TextField control={form.control} name="address" label="Address" placeholder="Optional — a human-readable address" />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField control={form.control} name="lat" label="Latitude" type="number" />
          <TextField control={form.control} name="lng" label="Longitude" type="number" />
        </div>

        <div className="flex flex-col-reverse items-stretch gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="outline" size="sm" onClick={useMyLocation}>
            <LocateFixed className="h-4 w-4" />
            Use my location
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save changes" : "Add place"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
