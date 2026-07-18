"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TextField } from "@/components/form";
import { vehicleFormSchema, type Vehicle, type VehicleFormValues } from "@/features/vehicle/schema";
import { useCreateVehicle, useUpdateVehicle } from "@/features/vehicle/hooks";

/**
 * Vehicle create/edit form (employee side). RHF + zodResolver on the SHARED schema. Employees do
 * NOT set approvalStatus — a new vehicle starts "inactive" and an admin approves it (Slice D's
 * surface). Only APPROVED vehicles can back a ride, enforced in the Offer flow + the API.
 */
export function VehicleForm({ initial, onDone }: { initial?: Vehicle; onDone?: () => void }) {
  const isEdit = Boolean(initial);
  const create = useCreateVehicle();
  const update = useUpdateVehicle(initial?.id ?? "");
  const pending = create.isPending || update.isPending;

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      model: initial?.model ?? "",
      registrationNo: initial?.registrationNo ?? "",
      seatingCapacity: initial?.seatingCapacity ?? 4,
    },
  });

  async function onSubmit(values: VehicleFormValues) {
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
        <TextField control={form.control} name="model" label="Model" placeholder="e.g. Maruti Suzuki Ciaz" />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            control={form.control}
            name="registrationNo"
            label="Registration number"
            placeholder="e.g. GJ01AB1234"
          />
          <TextField
            control={form.control}
            name="seatingCapacity"
            label="Seating capacity"
            type="number"
            placeholder="4"
            description="Excluding the driver's seat is up to you — it's the seats you'll offer."
          />
        </div>

        {!isEdit && (
          <p className="rounded-md border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
            New vehicles start <span className="font-medium">pending approval</span>. An administrator
            must approve it before you can offer rides with it.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save changes" : "Add vehicle"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
