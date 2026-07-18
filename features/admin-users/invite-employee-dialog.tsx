"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, Loader2, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TextField } from "@/components/form";
import { inviteFormSchema, type InviteFormValues } from "@/db/schema/invitation";

interface InviteEmployeeDialogProps {
  onSuccess?: () => void;
}

/**
 * Onboarding Path 2 — company_admin invites specific employees by email.
 * Sends POST /api/invitation with role=employee; orgId is inferred server-side from the session.
 */
export function InviteEmployeeDialog({ onSuccess }: InviteEmployeeDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: { email: "", role: "employee" },
  });

  async function onSubmit(values: InviteFormValues) {
    setLoading(true);
    try {
      const res = await fetch("/api/invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, role: "employee" }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error: { message: string } };
        form.setError("root", { message: data.error?.message ?? "Failed to send invite." });
        return;
      }

      setOpen(false);
      form.reset();
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" id="invite-employee-btn">
          <Mail className="mr-2 h-4 w-4" />
          Invite by Email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Invite Employee
          </DialogTitle>
          <DialogDescription>
            Send a secure invitation link to an employee&apos;s email. They&apos;ll set their own
            password when they accept.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <TextField
              control={form.control}
              name="email"
              label="Employee Email"
              type="email"
              placeholder="employee@acme.dev"
            />
            {form.formState.errors.root && (
              <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading} id="invite-employee-submit">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                {loading ? "Sending…" : "Send Invite"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
