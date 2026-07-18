"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Car, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { EmptyState } from "@/components/states";
import { RouteMap } from "@/components/map";
import { coCard, coAmberBtn, CoEyebrow } from "@/components/co/ui";
import { cn } from "@/lib/utils";
import { offerRideFormSchema, type OfferRideFormValues } from "@/features/ride/schema";
import { LocationField } from "@/features/ride/components/location-field";
import { DateTimeField } from "@/features/ride/components/datetime-field";
import { useOfferRide } from "@/features/ride/hooks";
import { useApprovedVehicles } from "@/features/vehicle/hooks";

/**
 * Offer-a-ride — the Coride two-pane form: route + when + seats + fare on the left, an approved-only
 * vehicle picker (and a live route preview) on the right. Only APPROVED vehicles appear; the API
 * enforces the same rule. Route geometry is cached server-side on submit, not from the preview.
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

  // Auto-select the first approved vehicle to prevent validation errors if they forget to click it
  React.useEffect(() => {
    if (vehicles && vehicles.length > 0 && !form.getValues("vehicleId")) {
      form.setValue("vehicleId", vehicles[0].id, { shouldValidate: true });
    }
  }, [vehicles, form]);

  const origin = form.watch("origin");
  const destination = form.watch("destination");
  const seatsTotal = form.watch("seatsTotal") ?? 1;
  const fare = form.watch("farePerSeat") ?? 0;
  const vehicleId = form.watch("vehicleId");
  const isRecurring = form.watch("isRecurring") ?? false;
  const recurrenceRule = form.watch("recurrenceRule") ?? "";

  const DAYS = [
    { code: "MO", label: "M" },
    { code: "TU", label: "T" },
    { code: "WE", label: "W" },
    { code: "TH", label: "T" },
    { code: "FR", label: "F" },
    { code: "SA", label: "S" },
    { code: "SU", label: "S" },
  ] as const;
  const activeDays = recurrenceRule ? recurrenceRule.split(",").filter(Boolean) : [];
  function toggleDay(code: string) {
    const set = new Set(activeDays);
    if (set.has(code)) set.delete(code);
    else set.add(code);
    const ordered = DAYS.map((d) => d.code).filter((c) => set.has(c));
    form.setValue("recurrenceRule", ordered.join(","));
  }
  function toggleRecurring(next: boolean) {
    form.setValue("isRecurring", next);
    if (next && !recurrenceRule) form.setValue("recurrenceRule", "MO,TU,WE,TH,FR");
    if (!next) form.setValue("recurrenceRule", "");
  }
  const bothSet = Boolean(origin?.lat && origin?.lng && destination?.lat && destination?.lng);
  const vehicleError = form.formState.errors.vehicleId?.message;

  async function onSubmit(values: OfferRideFormValues) {
    const ride = await offer.mutateAsync(values);
    router.push(`/app/rides?published=${ride.id}`);
  }

  // No approved vehicle → can't offer. Send them to register/await approval.
  if (!vehiclesLoading && (vehicles?.length ?? 0) === 0) {
    return (
      <EmptyState
        icon={Car}
        title="No approved vehicle yet"
        description="You need at least one admin-approved vehicle before you can offer a ride."
        action={<Button onClick={() => router.push("/app/vehicles")}>Manage vehicles</Button>}
      />
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid items-start gap-[18px] lg:grid-cols-2" noValidate>
        {/* Left — the ride details */}
        <div className={`${coCard} p-5 sm:p-[22px]`}>
          <div className="grid gap-4">
            <LocationField control={form.control} name="origin" label="Pickup" />
            <LocationField control={form.control} name="destination" label="Destination" />
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="min-w-[160px] flex-1">
              <DateTimeField control={form.control} name="departAt" label="Date & time" mode="datetime" />
            </div>
            <div className="min-w-[118px]">
              <span className="mb-1.5 block text-[12px] uppercase tracking-[0.05em] text-[color:var(--ink-3)]">
                Seats free
              </span>
              <div className="flex items-center overflow-hidden rounded-[10px] border border-[color:var(--line-2)] bg-[color:var(--surface-2)]">
                <button
                  type="button"
                  aria-label="One fewer seat"
                  onClick={() => form.setValue("seatsTotal", Math.max(1, seatsTotal - 1))}
                  className="h-[46px] w-[38px] text-[color:var(--ink)] transition hover:bg-[color:var(--line)]"
                >
                  <Minus className="mx-auto h-4 w-4" />
                </button>
                <span className="flex-1 text-center font-mono text-[16px] font-semibold text-[color:var(--ink)]">
                  {seatsTotal}
                </span>
                <button
                  type="button"
                  aria-label="One more seat"
                  onClick={() => form.setValue("seatsTotal", Math.min(8, seatsTotal + 1))}
                  className="h-[46px] w-[38px] text-[color:var(--ink)] transition hover:bg-[color:var(--line)]"
                >
                  <Plus className="mx-auto h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Fare per seat */}
          <label className="mt-4 block">
            <span className="mb-1.5 block text-[12px] uppercase tracking-[0.05em] text-[color:var(--ink-3)]">
              Fare per seat
            </span>
            <div className="flex items-center gap-2 rounded-[10px] border border-[color:var(--line-2)] bg-[color:var(--surface-2)] px-3.5">
              <span className="font-mono text-[17px] font-semibold text-[color:var(--amber-strong)]">₹</span>
              <input
                inputMode="numeric"
                value={String(fare)}
                onChange={(e) => form.setValue("farePerSeat", Number(e.target.value.replace(/\D/g, "")) || 0)}
                className="min-w-0 flex-1 border-none bg-transparent py-3 font-mono text-[17px] font-semibold text-[color:var(--ink)] outline-none"
                aria-label="Fare per seat in rupees"
              />
              <span className="text-[13px] text-[color:var(--ink-3)]">/ seat</span>
            </div>
          </label>

          {/* Recurring — repeat on chosen weekdays */}
          <div className="mt-4 rounded-[10px] border border-[color:var(--line)] bg-[color:var(--surface-2)] p-3.5">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold text-[color:var(--ink)]">Recurring</div>
                <div className="text-[12px] text-[color:var(--ink-3)]">Repeat this ride on the same weekdays</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isRecurring}
                aria-label="Recurring ride"
                onClick={() => toggleRecurring(!isRecurring)}
                className={cn(
                  "relative h-[26px] w-[46px] shrink-0 rounded-full border transition-colors",
                  isRecurring
                    ? "border-[color:var(--amber-line)] bg-[color:var(--btn-amber-bg)]"
                    : "border-[color:var(--line-2)] bg-[color:var(--surface)]",
                )}
              >
                <span
                  className={cn(
                    "absolute top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-white shadow-sm transition-all",
                    isRecurring ? "left-[24px]" : "left-[3px]",
                  )}
                />
              </button>
            </div>
            {isRecurring && (
              <div className="mt-3 flex flex-wrap gap-2">
                {DAYS.map((d, i) => {
                  const on = activeDays.includes(d.code);
                  return (
                    <button
                      key={d.code}
                      type="button"
                      onClick={() => toggleDay(d.code)}
                      aria-pressed={on}
                      aria-label={d.code}
                      className={cn(
                        "h-9 w-9 rounded-full border font-mono text-[13px] font-semibold transition",
                        on
                          ? "border-[color:var(--amber-line)] bg-[color:var(--amber-tint)] text-[color:var(--amber-strong)]"
                          : "border-[color:var(--line-2)] bg-[color:var(--surface)] text-[color:var(--ink-3)] hover:border-[color:var(--ink-3)]",
                      )}
                    >
                      {d.label}
                      <span className="sr-only">{d.code}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Debug block for silent validation errors */}
          {Object.keys(form.formState.errors).length > 0 && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 font-mono whitespace-pre-wrap">
              <strong>Form validation errors:</strong>
              {"\n"}{JSON.stringify(form.formState.errors, null, 2)}
            </div>
          )}

          <button
            type="submit"
            disabled={offer.isPending}
            className={`${coAmberBtn} mt-[18px] w-full py-3.5 text-[15px]`}
          >
            {offer.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Publish ride
          </button>
        </div>

        {/* Right — vehicle picker + route preview */}
        <div>
          <CoEyebrow className="mb-3">Choose vehicle · approved only</CoEyebrow>
          <div className="flex flex-col gap-2.5">
            {vehiclesLoading && (
              <div className="py-4 text-center text-[13px] text-[color:var(--ink-3)]">Loading vehicles…</div>
            )}
            {vehicles?.map((v) => {
              const selected = vehicleId === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => form.setValue("vehicleId", v.id, { shouldValidate: true })}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border bg-[color:var(--surface)] p-3.5 text-left transition",
                    selected
                      ? "border-[color:var(--amber-strong)] ring-1 ring-[color:var(--amber-strong)]"
                      : "border-[color:var(--line)] hover:border-[color:var(--line-2)]",
                  )}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[color:var(--surface-2)] text-[color:var(--ink)]">
                    <Car className="h-5 w-5" strokeWidth={1.6} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold text-[color:var(--ink)]">{v.model}</div>
                    <div className="font-mono text-[12px] text-[color:var(--ink-3)]">
                      {v.registrationNo} · {v.seatingCapacity} seats
                    </div>
                  </div>
                  <span className="rounded-full bg-[color:var(--ok-tint)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--ok)]">
                    approved
                  </span>
                </button>
              );
            })}
          </div>
          {vehicleError && <p className="mt-2 text-[13px] font-medium text-destructive">{vehicleError}</p>}
          <p className="mt-3 text-[12.5px] text-[color:var(--ink-3)]">
            Inactive vehicles are awaiting admin approval.
          </p>

          {/* Live route preview */}
          <div className="mt-4">
            {bothSet ? (
              <RouteMap
                origin={{ ...origin, label: origin.label || "Pickup" }}
                destination={{ ...destination, label: destination.label || "Destination" }}
                height={300}
              />
            ) : (
              <div className="flex h-[180px] items-center justify-center rounded-2xl border border-dashed border-[color:var(--line-2)] bg-[color:var(--surface-2)] px-6 text-center text-[13px] text-[color:var(--ink-3)]">
                Pick a pickup and destination to preview the route and distance.
              </div>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}
