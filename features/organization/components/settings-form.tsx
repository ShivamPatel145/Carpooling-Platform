"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TextField } from "@/components/form";
import { organizationFormSchema, type OrganizationFormValues, type Organization } from "@/db/schema/organization";

interface OrgSettingsFormProps {
  org: Organization;
}

/**
 * Organization Settings form — company_admin edits their own org's carpooling config.
 * Calls PATCH /api/organization/[id].
 * SEAM with Slice C: fuelCostPerKm + travelCostPerKm + maintenanceMonthly are read by reports.
 */
export function OrgSettingsForm({ org }: OrgSettingsFormProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [domainsInput, setDomainsInput] = useState(org.allowedEmailDomains.join(", "));

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: org.name,
      allowedEmailDomains: org.allowedEmailDomains,
      currency: org.currency,
      fuelCostPerKm: parseFloat(String(org.fuelCostPerKm)) || 0,
      travelCostPerKm: parseFloat(String(org.travelCostPerKm)) || 0,
      maintenanceMonthly: parseFloat(String(org.maintenanceMonthly)) || 0,
      autoApproveDomain: org.autoApproveDomain,
    },
  });

  async function onSubmit(values: OrganizationFormValues) {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const domains = domainsInput
        .split(",")
        .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
        .filter(Boolean);

      const res = await fetch(`/api/organization/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, allowedEmailDomains: domains }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error: { message: string } };
        setError(data.error?.message ?? "Failed to save settings.");
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Company Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Company Details</CardTitle>
            <CardDescription>Basic information about your organization.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TextField
              control={form.control}
              name="name"
              label="Company Name"
              placeholder="Acme Mobility"
            />
            <div className="space-y-1.5">
              <Label htmlFor="org-domains">Allowed Email Domains</Label>
              <input
                id="org-domains"
                type="text"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="acme.dev, acme.com  (comma-separated)"
                value={domainsInput}
                onChange={(e) => setDomainsInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Employees with these email domains can self-register and join this org (Onboarding Path 3).
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Switch
                id="org-auto-approve"
                checked={form.watch("autoApproveDomain")}
                onCheckedChange={(v) => form.setValue("autoApproveDomain", v)}
              />
              <div>
                <Label htmlFor="org-auto-approve" className="font-medium">Auto-approve domain signups</Label>
                <p className="text-xs text-muted-foreground">
                  When on, domain-matched employees are immediately active. When off, they queue for approval.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Carpooling Cost Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Carpooling Configuration</CardTitle>
            <CardDescription>
              Cost parameters used by Slice C&apos;s financial reports and ride pricing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TextField
              control={form.control}
              name="currency"
              label="Currency Code"
              placeholder="INR"
            />
            <div className="grid grid-cols-2 gap-4">
              <TextField
                control={form.control}
                name="fuelCostPerKm"
                label="Fuel Cost / km (₹)"
                type="number"
                placeholder="7.50"
                description="Cost per km of fuel for ride pricing."
              />
              <TextField
                control={form.control}
                name="travelCostPerKm"
                label="Travel Cost / km (₹)"
                type="number"
                placeholder="12.00"
                description="Per-km rate for cost reports."
              />
            </div>
            <TextField
              control={form.control}
              name="maintenanceMonthly"
              label="Monthly Maintenance (₹)"
              type="number"
              placeholder="15000"
              description="Monthly fleet maintenance line item for Financial Summary."
            />
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving} id="save-settings-btn">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saving ? "Saving…" : saved ? "Saved!" : "Save Settings"}
          </Button>
          {saved && (
            <p className="text-sm text-muted-foreground">
              Settings saved. Slice C's reports will use the updated cost values.
            </p>
          )}
        </div>
      </form>
    </Form>
  );
}
