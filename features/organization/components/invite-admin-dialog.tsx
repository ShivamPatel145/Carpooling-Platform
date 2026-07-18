"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Loader2, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { TextField } from "@/components/form";
import { coAmberBtn, coGhostBtn } from "@/components/co/ui";
import { inviteFormSchema, type InviteFormValues } from "@/db/schema/invitation";
import type { OrgRow } from "../columns";

interface InviteAdminDialogProps {
  org: OrgRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Send a tokenized invite to a company_admin for an existing org.
 * Calls POST /api/invitation with role=company_admin.
 */
export function InviteAdminDialog({ org, open, onOpenChange, onSuccess }: InviteAdminDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: { email: "", role: "company_admin" },
  });

  async function onSubmit(values: InviteFormValues) {
    if (!org) return;
    setLoading(true);
    try {
      const res = await fetch("/api/invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, orgId: org.id, role: "company_admin" }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error: { message: string } };
        form.setError("root", { message: data.error?.message ?? "Failed to send invitation." });
        return;
      }

      onOpenChange(false);
      form.reset();
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[color:var(--amber-strong)]" />
            Invite Company Admin
          </DialogTitle>
          <DialogDescription>
            Invite an admin to manage <strong>{org?.name}</strong>. They&apos;ll receive a
            tokenized link to set their password.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <TextField
              control={form.control}
              name="email"
              label="Admin Email"
              type="email"
              placeholder="admin@acme.dev"
            />

            {form.formState.errors.root && (
              <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className={`${coGhostBtn} h-10 px-4 text-[14px]`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                id="invite-admin-submit"
                className={`${coAmberBtn} h-10 px-4 text-[14px]`}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {loading ? "Sending…" : "Send Invitation"}
              </button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
