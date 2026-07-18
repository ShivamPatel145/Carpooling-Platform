"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TextField, SelectField, DateField, SwitchField, FileField } from "@/components/form";
import { demoEntityFormSchema, demoStatusOptions, type DemoEntity, type DemoEntityFormValues } from "@/features/_demo/schema";
import { useCreateDemoEntity, useUpdateDemoEntity } from "@/features/_demo/hooks";

/**
 * The demoEntity create/edit form. RHF + zodResolver on the SHARED schema (same object the API
 * validates). Exercises every form primitive: text, textarea, select, number, date, switch, file.
 * Copy this for a real entity and swap the fields.
 */
export function DemoEntityForm({
  initial,
  uploadsEnabled = true,
  onDone,
}: {
  initial?: DemoEntity;
  uploadsEnabled?: boolean;
  onDone?: () => void;
}) {
  const isEdit = Boolean(initial);
  const create = useCreateDemoEntity();
  const update = useUpdateDemoEntity(initial?.id ?? "");
  const pending = create.isPending || update.isPending;

  const form = useForm<DemoEntityFormValues>({
    resolver: zodResolver(demoEntityFormSchema),
    defaultValues: {
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      status: initial?.status ?? "draft",
      amount: initial?.amount ?? 0,
      dueDate: initial?.dueDate ? new Date(initial.dueDate) : null,
      isPinned: initial?.isPinned ?? false,
      attachmentUrl: initial?.attachmentUrl ?? "",
    },
  });

  async function onSubmit(values: DemoEntityFormValues) {
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
        <TextField control={form.control} name="name" label="Name" placeholder="e.g. Q3 rollout" />
        <TextField
          control={form.control}
          name="description"
          label="Description"
          placeholder="Optional details…"
          multiline
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField control={form.control} name="status" label="Status" options={demoStatusOptions} />
          <TextField control={form.control} name="amount" label="Amount" type="number" placeholder="0" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <DateField control={form.control} name="dueDate" label="Due date" />
          <FileField
            control={form.control}
            name="attachmentUrl"
            label="Attachment"
            uploadsEnabled={uploadsEnabled}
          />
        </div>
        <SwitchField
          control={form.control}
          name="isPinned"
          label="Pin this item"
          description="Pinned items surface at the top of lists."
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save changes" : "Create item"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
