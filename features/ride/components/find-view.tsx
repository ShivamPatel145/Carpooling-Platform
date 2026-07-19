"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftRight, Loader2, Search, SearchX, Minus, Plus } from "lucide-react";
import { Form } from "@/components/ui/form";
import { EmptyState, ErrorState, Spinner } from "@/components/states";
import { coCard, coAmberBtn } from "@/components/co/ui";
import { cn } from "@/lib/utils";
import { findRideFormSchema, type FindRideFormValues, type RideWithMeta } from "@/features/ride/schema";
import { LocationField } from "@/features/ride/components/location-field";
import { DateTimeField } from "@/features/ride/components/datetime-field";
import { RideCard } from "@/features/ride/components/ride-card";
import { BookDialog } from "@/features/ride/components/book-dialog";
import { useSearchRides } from "@/features/ride/hooks";

/**
 * Find-a-ride: the Coride search card (route + when + seats + recurring) over a results list, with
 * all five data states handled. Search is a mutation (POST body), so loading/empty/error are driven
 * off its state while the last results stay in view.
 */
export function FindView() {
  const search = useSearchRides();
  const [results, setResults] = React.useState<RideWithMeta[] | null>(null);

  const form = useForm<FindRideFormValues>({
    resolver: zodResolver(findRideFormSchema),
    defaultValues: {
      origin: { label: "", lat: 0, lng: 0 },
      destination: { label: "", lat: 0, lng: 0 },
      date: new Date(),
      seats: 1,
      isRecurring: false,
    },
  });

  const seats = form.watch("seats") ?? 1;
  const recurring = form.watch("isRecurring") ?? false;

  async function onSubmit(values: FindRideFormValues) {
    const rows = await search.mutateAsync(values);
    setResults(rows);
  }

  /** Wireframe §7.2: swap start ⇄ destination in one tap. */
  function swapEnds() {
    const origin = form.getValues("origin");
    const destination = form.getValues("destination");
    form.setValue("origin", destination, { shouldValidate: false });
    form.setValue("destination", origin, { shouldValidate: false });
  }

  return (
    <div>
      {/* Search card */}
      <div className={`${coCard} mb-5 p-5 sm:p-[22px]`}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <div className="relative grid gap-4 sm:grid-cols-2">
              <LocationField control={form.control} name="origin" label="Pickup location" />
              <LocationField control={form.control} name="destination" label="Drop location" />
              {/* Swap ends — floats between the two fields (stacked on mobile, side-by-side ≥sm). */}
              <button
                type="button"
                onClick={swapEnds}
                aria-label="Swap pickup and drop"
                title="Swap pickup and drop"
                className="absolute left-1/2 top-[34px] hidden h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border border-[color:var(--line-2)] bg-[color:var(--surface)] text-[color:var(--amber-strong)] shadow-sm transition-colors hover:border-[color:var(--amber-line)] sm:flex"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={swapEnds}
                aria-label="Swap pickup and drop"
                className="inline-flex items-center gap-1.5 justify-self-start rounded-md px-1.5 py-1 text-xs font-medium text-[color:var(--amber-strong)] hover:underline sm:hidden"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" /> Swap
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-4">
              <div className="min-w-[160px] flex-1">
                <DateTimeField control={form.control} name="date" label="Date & time" mode="date" />
              </div>

              {/* Seats stepper */}
              <div className="min-w-[120px]">
                <span className="mb-1.5 block text-[12px] uppercase tracking-[0.05em] text-[color:var(--ink-3)]">
                  Seats
                </span>
                <div className="flex items-center overflow-hidden rounded-[10px] border border-[color:var(--line-2)] bg-[color:var(--surface-2)]">
                  <button
                    type="button"
                    aria-label="One fewer seat"
                    onClick={() => form.setValue("seats", Math.max(1, seats - 1))}
                    className="h-[46px] w-10 text-[20px] text-[color:var(--ink)] transition hover:bg-[color:var(--line)]"
                  >
                    <Minus className="mx-auto h-4 w-4" />
                  </button>
                  <span className="flex-1 text-center font-mono text-[16px] font-semibold text-[color:var(--ink)]">
                    {seats}
                  </span>
                  <button
                    type="button"
                    aria-label="One more seat"
                    onClick={() => form.setValue("seats", Math.min(8, seats + 1))}
                    className="h-[46px] w-10 text-[20px] text-[color:var(--ink)] transition hover:bg-[color:var(--line)]"
                  >
                    <Plus className="mx-auto h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Recurring toggle */}
              <div className="flex items-center gap-2.5 pb-1">
                <div>
                  <div className="text-[13.5px] font-semibold text-[color:var(--ink)]">Recurring</div>
                  <div className="text-[11.5px] text-[color:var(--ink-3)]">Repeat weekdays</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={recurring}
                  aria-label="Recurring weekdays"
                  onClick={() => form.setValue("isRecurring", !recurring)}
                  className={cn(
                    "relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors",
                    recurring ? "bg-[color:var(--amber-strong)]" : "bg-[color:var(--line-2)]",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-[3px] h-5 w-5 rounded-full bg-white shadow transition-all",
                      recurring ? "left-[23px]" : "left-[3px]",
                    )}
                  />
                </button>
              </div>

              <button
                type="submit"
                disabled={search.isPending}
                className={`${coAmberBtn} h-[46px] px-6 text-[15px]`}
              >
                {search.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Search
              </button>
            </div>
          </form>
        </Form>
      </div>

      {/* Results */}
      <div className="space-y-3.5">
        {search.isPending && <Spinner label="Finding rides on your route…" />}

        {search.isError && (
          <ErrorState
            title="Search failed"
            description="We couldn't search right now. Please try again."
            onRetry={() => form.handleSubmit(onSubmit)()}
          />
        )}

        {!search.isPending && !search.isError && results !== null && results.length === 0 && (
          <EmptyState
            icon={SearchX}
            title="No rides match yet"
            description="No colleague is driving that route at that time. Try a wider time window — or offer the ride yourself."
          />
        )}

        {!search.isPending && results && results.length > 0 && (
          <>
            <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
              <div className="font-mono text-[13.5px] text-[color:var(--ink-2)]">
                <span className="font-semibold text-[color:var(--ink)]">
                  {results.length} ride{results.length === 1 ? "" : "s"}
                </span>{" "}
                on your route
              </div>
              <div className="text-[12.5px] text-[color:var(--ink-3)]">Sorted by departure</div>
            </div>
            {results.map((r) => (
              <RideCard
                key={r.id}
                ride={r}
                action={<BookDialog ride={r} />}
              />
            ))}
          </>
        )}

        {results === null && !search.isPending && (
          <EmptyState
            icon={Search}
            title="Search for a ride"
            description="Enter where you're going and when. We'll match colleagues driving the same route."
          />
        )}
      </div>
    </div>
  );
}
