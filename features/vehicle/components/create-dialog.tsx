"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VehicleForm } from "@/features/vehicle/form";

/** "Add vehicle" button that opens the create form in a dialog. */
export function CreateVehicleDialog({ label = "Add vehicle" }: { label?: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Register a vehicle</DialogTitle>
          <DialogDescription>
            Add a car you can offer rides with. It needs admin approval before it goes live.
          </DialogDescription>
        </DialogHeader>
        <VehicleForm onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
