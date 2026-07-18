"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TextField, SelectField, SwitchField } from "@/components/form";
import { EmptyState } from "@/components/states";
import { RouteMap } from "@/components/map";
import { offerRideFormSchema, type OfferRideFormValues } from "@/features/ride/schema";
import { LocationField } from "@/features/ride/components/location-field";
import { DateTimeField } from "@/features/ride/components/datetime-field";
import { useOfferRide } from "@/features/ride/hooks";
import { useApprovedVehicles } from "@/features/vehicle/hooks";

/**
 * Offer-a-ride form. Only APPROVED vehicles appear in the picker — the API enforces the same rule.
 * Once both endpoints have coordinates, a live RouteMap preview renders (OSRM road route, or the
 * straight-line fallback). Route geometry is cached server-side on submit, not from this preview.
 */
export function OfferRideForm() {
  const router = useRouter();
  const offer = useOfferRide();
  const { data: vehicles, isLoading: vehiclesLoading } = useApprovedVehicles();

  const form = useForm<OfferRideFormValues>({
    resolver: zodResolver(offerRideFormSchema),
    defaultValues: {
      vehicleId: "",
      origin: { label: "", lat: 0, lng: 0 },
      destination: { label: "", lat: 0, lng: 0 },
      seatsTotal: 3,
      farePerSeat: 50,
      isRecurring: false,
      recurrenceRule: "",
    },
  });

  const origin = form.watch("origin");
  const destination = form.watch("destination");
  const bothSet =
    Boolean(origin?.lat && origin?.lng && destination?.lat && destination?.lng);

  async function onSubmit(values: OfferRideFormValues) {
    const ride = await offer.mutateAsync(values);
    router.push(`/app/rides?published=${ride.id}`);
  }

  const vehicleOptions =
    vehicles?.map((v) => ({ value: v.id, label: `${v.model} · ${v.registrationNo}` })) ?? [];

  // No approved vehicle → can't offer. Send them to register/await approval.
  if (!vehiclesLoading && vehicleOptions.length === 0) {
    return (
      <EmptyState
        icon={Car}
        title="No approved vehicle yet"
        description="You need at least one admin-approved vehicle before you can offer a ride."
        action={
          <Button onClick={() => router.push("/app/vehicles")}>Manage vehicles</Button>
        }
      />
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-2" noValidate>
        <div className="space-y-5">
          <SelectField
            control={form.control}
            name="vehicleId"
            label="Vehicle"
            options={vehicleOptions}
            placeholder={vehiclesLoading ? "Loading vehicles…" : "Choose an approved vehicle"}
          />

          <LocationField control={form.control} name="origin" label="Pickup" />
          <LocationField control={form.control} name="destination" label="Destination" />

          <DateTimeField control={form.control} name="departAt" label="Departure" mode="datetime" />

          <div className="grid grid-cols-2 gap-4">
            <TextField control={form.control} name="seatsTotal" label="Seats offered" type="number" />
            <TextField
              control={form.control}
              name="farePerSeat"
              label="Fare per seat (₹)"
              type="number"
            />
          </div>

          <SwitchField
            control={form.control}
            name="isRecurring"
            label="Recurring commute"
            description="Repeats on your usual working days."
          />
          {form.watch("isRecurring") && (
            <TextField
              control={form.control}
              name="recurrenceRule"
              label="Days"
              placeholder="e.g. MO,TU,WE,TH,FR"
            />
          )}

          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={offer.isPending}>
              {offer.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Publish ride
            </Button>
          </div>
        </div>

        {/* Live preview */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          {bothSet ? (
            <RouteMap
              origin={{ ...origin, label: origin.label || "Pickup" }}
              destination={{ ...destination, label: destination.label || "Destination" }}
              height={420}
            />
          ) : (
            <div className="flex h-[420px] items-center justify-center rounded-lg border border-dashed bg-muted/30 text-center text-sm text-muted-foreground">
              <p className="max-w-xs px-6">
                Pick a pickup and destination to preview the route and distance.
              </p>
            </div>
          )}
        </div>
      </form>
    </Form>
  );
}
