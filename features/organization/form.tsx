"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TextField } from "@/components/form";
import { coAmberBtn, coGhostBtn } from "@/components/co/ui";
import { organizationFormSchema, type OrganizationFormValues } from "@/db/schema/organization";

interface CreateOrgDialogProps {
  onSuccess?: () => void;
}

/**
 * Create Organization dialog for super-admin.
 * Calls POST /api/organization with optional admin email for invite.
 */
export function CreateOrgDialog({ onSuccess }: CreateOrgDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [domainsInput, setDomainsInput] = useState("");

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: "",
      allowedEmailDomains: [],
      currency: "INR",
      fuelCostPerKm: 0,
      travelCostPerKm: 0,
      maintenanceMonthly: 0,
      autoApproveDomain: false,
    },
  });

  async function onSubmit(values: OrganizationFormValues) {
    setLoading(true);
    try {
      // Parse domains from comma-separated input
      const domains = domainsInput
        .split(",")
        .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
        .filter(Boolean);

      const payload = {
        ...values,
        allowedEmailDomains: domains,
        ...(adminEmail ? { invite: { email: adminEmail } } : {}),
      };

      const res = await fetch("/api/organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error: { message: string } };
        form.setError("root", { message: data.error?.message ?? "Failed to create organization." });
        return;
      }

      setOpen(false);
      form.reset();
      setAdminEmail("");
      setDomainsInput("");
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" id="create-org-btn" className={`${coAmberBtn} h-10 px-4 text-[14px]`}>
          <Building2 className="h-4 w-4" strokeWidth={1.8} />
          New organization
        </button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[540px]">
        <DialogHeader className="border-b border-[color:var(--line)] px-6 pb-4 pt-6 text-left">
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>
            Set up a new tenant. Optionally send an invite to the first Company Admin right away.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            {/* Scrollable body — fields scroll while the header and actions stay pinned */}
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <TextField
                control={form.control}
                name="name"
                label="Company Name"
                placeholder="Acme Mobility"
              />

              {/* Email Domains */}
              <div className="space-y-1.5">
                <Label htmlFor="domains-input">Allowed Email Domains</Label>
                <input
                  id="domains-input"
                  type="text"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="acme.dev, acme.com  (comma-separated)"
                  value={domainsInput}
                  onChange={(e) => setDomainsInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Self-registering employees with these domains are mapped to this org.
                </p>
              </div>

              {/* Auto-approve toggle */}
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Switch
                  id="auto-approve"
                  checked={form.watch("autoApproveDomain")}
                  onCheckedChange={(v) => form.setValue("autoApproveDomain", v)}
                />
                <div>
                  <Label htmlFor="auto-approve" className="font-medium">Auto-approve domain signups</Label>
                  <p className="text-xs text-muted-foreground">Domain-matched employees become active immediately.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <TextField
                  control={form.control}
                  name="currency"
                  label="Currency"
                  placeholder="INR"
                />
                <TextField
                  control={form.control}
                  name="fuelCostPerKm"
                  label="Fuel Cost / km (₹)"
                  type="number"
                  placeholder="7.50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <TextField
                  control={form.control}
                  name="travelCostPerKm"
                  label="Travel Cost / km (₹)"
                  type="number"
                  placeholder="12.00"
                />
                <TextField
                  control={form.control}
                  name="maintenanceMonthly"
                  label="Monthly Maintenance (₹)"
                  type="number"
                  placeholder="15000"
                />
              </div>

              {/* Invite admin (optional) */}
              <div className="space-y-1.5 rounded-lg border border-dashed p-3">
                <Label htmlFor="admin-email">Invite Company Admin (optional)</Label>
                <input
                  id="admin-email"
                  type="email"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="admin@acme.dev"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  An invite email will be sent immediately after creation.
                </p>
              </div>

              {form.formState.errors.root && (
                <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
              )}
            </div>

            {/* Pinned action bar — always reachable regardless of scroll */}
            <div className="flex justify-end gap-2 border-t border-[color:var(--line)] px-6 py-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={`${coGhostBtn} h-10 px-4 text-[14px]`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                id="create-org-submit"
                className={`${coAmberBtn} h-10 px-4 text-[14px]`}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? "Creating…" : "Create organization"}
              </button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
