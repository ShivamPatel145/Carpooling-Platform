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
import { DemoEntityForm } from "@/features/_demo/form";
import { features } from "@/lib/client-features";

/** "New item" button that opens the create form in a dialog. */
export function CreateDemoEntityDialog({ label = "New item" }: { label?: string }) {
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
          <DialogTitle>Create item</DialogTitle>
          <DialogDescription>Add a new demo entity. This is the CRUD template.</DialogDescription>
        </DialogHeader>
        <DemoEntityForm uploadsEnabled={features.uploads} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
