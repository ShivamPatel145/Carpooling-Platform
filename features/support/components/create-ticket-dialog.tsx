"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { coAmberBtn } from "@/components/co/ui";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supportTicketFormSchema, type SupportTicketFormValues } from "@/db/schema";
import { createSupportTicket } from "@/app/(dashboard)/support/actions";

const coInput =
  "w-full rounded-[10px] border border-[color:var(--line-2)] bg-[color:var(--surface-2)] px-3.5 py-3 text-[15px] text-[color:var(--ink)] outline-none transition-colors placeholder:text-[color:var(--ink-3)] focus:border-[color:var(--amber-strong)]";

const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

/**
 * Raise-a-ticket dialog (Coride). RHF + the shared supportTicketFormSchema (one schema, reused by
 * the server action). Submits through the createSupportTicket server action; the requester + org are
 * stamped server-side. On success it refreshes the server-rendered ticket list.
 */
export function CreateTicketDialog() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const form = useForm<SupportTicketFormValues>({
    resolver: zodResolver(supportTicketFormSchema),
    defaultValues: { subject: "", description: "", priority: "medium" },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  async function onSubmit(values: SupportTicketFormValues) {
    try {
      await createSupportTicket(values);
      toast({ variant: "success", title: "Ticket raised", description: "We'll get back to you shortly." });
      reset({ subject: "", description: "", priority: "medium" });
      setOpen(false);
      router.refresh();
    } catch {
      toast({ variant: "destructive", title: "Couldn't raise ticket", description: "Please try again." });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={cn(coAmberBtn, "px-[18px] py-2.5 text-[14px]")}>
          <Plus className="h-4 w-4" />
          New ticket
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Raise a ticket</DialogTitle>
          <DialogDescription>Tell us what went wrong and we&apos;ll help.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="subject" className="mb-1.5 block text-[13px] font-semibold text-[color:var(--ink-2)]">
              Subject
            </label>
            <input
              id="subject"
              placeholder="e.g. Driver didn't show up"
              className={cn(coInput, errors.subject && "border-[color:var(--destructive)]")}
              {...register("subject")}
            />
            {errors.subject && (
              <p className="mt-1 text-[12.5px] text-[color:var(--destructive)]">{errors.subject.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="priority" className="mb-1.5 block text-[13px] font-semibold text-[color:var(--ink-2)]">
              Priority
            </label>
            <select id="priority" className={cn(coInput, "capitalize")} {...register("priority")}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p} className="capitalize">
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="mb-1.5 block text-[13px] font-semibold text-[color:var(--ink-2)]">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              placeholder="Share the details — where, when, and what happened."
              className={cn(coInput, "resize-none", errors.description && "border-[color:var(--destructive)]")}
              {...register("description")}
            />
            {errors.description && (
              <p className="mt-1 text-[12.5px] text-[color:var(--destructive)]">{errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center rounded-[10px] border border-[color:var(--line-2)] bg-[color:var(--surface)] px-4 py-2.5 text-[14px] font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--ink)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(coAmberBtn, "px-5 py-2.5 text-[14px]")}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit ticket
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
