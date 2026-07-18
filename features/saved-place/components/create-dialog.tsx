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
import { SavedPlaceForm } from "@/features/saved-place/form";

export function CreateSavedPlaceDialog({ label = "Add place" }: { label?: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a saved place</DialogTitle>
          <DialogDescription>Home, Office, or any spot you travel to often.</DialogDescription>
        </DialogHeader>
        <SavedPlaceForm onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
