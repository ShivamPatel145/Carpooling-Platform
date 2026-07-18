"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Search, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { TextField } from "@/components/form";
import { EmptyState, ErrorState, Spinner } from "@/components/states";
import { findRideFormSchema, type FindRideFormValues, type RideWithMeta } from "@/features/ride/schema";
import { LocationField } from "@/features/ride/components/location-field";
import { DateTimeField } from "@/features/ride/components/datetime-field";
import { RideCard } from "@/features/ride/components/ride-card";
import { BookDialog } from "@/features/ride/components/book-dialog";
import { useSearchRides } from "@/features/ride/hooks";

/**
 * Find-a-ride: a search form + results, all five data states handled. Search is a mutation (POST
 * body), so we drive loading/empty/error off its state and keep the last results in view.
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

  async function onSubmit(values: FindRideFormValues) {
    const rows = await search.mutateAsync(values);
    setResults(rows);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card className="lg:sticky lg:top-4 lg:self-start">
        <CardContent className="p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <LocationField control={form.control} name="origin" label="From" />
              <LocationField control={form.control} name="destination" label="To" />
              <div className="grid grid-cols-2 gap-3">
                <DateTimeField control={form.control} name="date" label="Date" mode="date" />
                <TextField control={form.control} name="seats" label="Seats" type="number" />
              </div>
              <Button type="submit" className="w-full" disabled={search.isPending}>
                {search.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Search rides
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="space-y-3">
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
            <p className="text-sm text-muted-foreground">
              {results.length} ride{results.length === 1 ? "" : "s"} on your route
            </p>
            {results.map((r) => (
              <RideCard key={r.id} ride={r} action={<BookDialog ride={r} />} />
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
