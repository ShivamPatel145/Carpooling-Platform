"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TextField } from "@/components/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RouteMap } from "@/components/map";
import { bookingFormSchema, type BookingFormValues, type RideWithMeta } from "@/features/ride/schema";
import { useBookRide } from "@/features/ride/hooks";

/**
 * Book-a-seat dialog. Shows the route (cached geometry if the ride has it), lets the passenger pick
 * seat count, previews the fare, and books. Seat availability + the race are enforced server-side;
 * a lost race surfaces as a toast from the mutation.
 */
export function BookDialog({ ride }: { ride: RideWithMeta }) {
  const [open, setOpen] = React.useState(false);
  const book = useBookRide();

  const maxSeats = ride.seatsAvailable;
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      rideId: ride.id,
      seatsBooked: Math.min(ride.seatsRequested ?? 1, maxSeats),
    },
  });

  const seats = Number(form.watch("seatsBooked")) || 0;
  const fare = (Number(ride.farePerSeat) * seats).toFixed(0);

  async function onSubmit(values: BookingFormValues) {
    await book.mutateAsync(values);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Book</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Book this ride</DialogTitle>
          <DialogDescription>
            {ride.origin.label} → {ride.destination.label}
            {ride.driverName ? ` · with ${ride.driverName}` : ""}
          </DialogDescription>
        </DialogHeader>

        <RouteMap
          origin={{ ...ride.origin }}
          destination={{ ...ride.destination }}
          routeGeoJSON={(ride.routeGeoJSON as never) ?? null}
          height={220}
          interactive={false}
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <TextField
              control={form.control}
              name="seatsBooked"
              label={`Seats (max ${maxSeats})`}
              type="number"
            />
            <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Total fare</span>
              <span className="inline-flex items-center gap-0.5 font-mono font-medium tabular-nums">
                <IndianRupee className="h-3.5 w-3.5" />
                {fare}
              </span>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={book.isPending || seats < 1 || seats > maxSeats}>
                {book.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm booking
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
