"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Check } from "lucide-react";
import { coCard, coAmberBtn } from "@/components/co/ui";
import { cn } from "@/lib/utils";
import { organizationFormSchema, type OrganizationFormValues, type Organization } from "@/db/schema/organization";

interface OrgSettingsFormProps {
  org: Organization;
}

const INPUT_CLASS =
  "w-full rounded-[10px] border border-[color:var(--line-2)] bg-[color:var(--surface-2)] px-3.5 py-3 text-[15px] text-[color:var(--ink)] outline-none transition-colors placeholder:text-[color:var(--ink-3)] focus:border-[color:var(--amber-strong)]";
const LABEL_CLASS = "mb-1.5 block text-[13px] text-[color:var(--ink-2)]";

/** A Coride pill switch — ink track, amber when on. */
function PillSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-[26px] w-[46px] shrink-0 rounded-full border transition-colors",
        checked
          ? "border-[color:var(--amber-line)] bg-[color:var(--btn-amber-bg)]"
          : "border-[color:var(--line-2)] bg-[color:var(--surface-2)]",
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-white shadow-sm transition-all",
          checked ? "left-[24px]" : "left-[3px]",
        )}
      />
    </button>
  );
}

/**
 * Organization Settings form — company_admin edits their own org's carpooling config, restyled to
 * the Coride vocabulary. Calls PATCH /api/organization/[id]. Same RHF form, field names, resolver
 * and submit handler as before — only presentation changed.
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
      headOffice: ((org.settings as Record<string, unknown> | null)?.headOffice as string) ?? "",
      currency: org.currency,
      fuelCostPerKm: parseFloat(String(org.fuelCostPerKm)) || 0,
      travelCostPerKm: parseFloat(String(org.travelCostPerKm)) || 0,
      maintenanceMonthly: parseFloat(String(org.maintenanceMonthly)) || 0,
      autoApproveDomain: org.autoApproveDomain,
    },
  });

  const { register, handleSubmit, watch, setValue, formState } = form;
  const autoApprove = watch("autoApproveDomain");

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

  const fieldError = (name: keyof OrganizationFormValues) =>
    formState.errors[name]?.message as string | undefined;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      {/* Company details */}
      <section className={`${coCard} p-5 sm:p-6`}>
        <div className="mb-5">
          <h3 className="m-0 font-display text-[17px] font-semibold text-[color:var(--ink)]">
            Company details
          </h3>
          <p className="m-0 mt-1 text-[13px] text-[color:var(--ink-3)]">
            Basic information about your organisation.
          </p>
        </div>

        <div className="grid gap-4">
          <label className="block">
            <span className={LABEL_CLASS}>Company name</span>
            <input {...register("name")} className={INPUT_CLASS} placeholder="Acme Mobility" />
            {fieldError("name") && (
              <p className="mt-1.5 text-[12.5px] text-[color:var(--destructive)]">{fieldError("name")}</p>
            )}
          </label>

          <label className="block">
            <span className={LABEL_CLASS}>Allowed email domains</span>
            <input
              id="org-domains"
              type="text"
              className={INPUT_CLASS}
              placeholder="acme.dev, acme.com  (comma-separated)"
              value={domainsInput}
              onChange={(e) => setDomainsInput(e.target.value)}
            />
            <p className="mt-1.5 text-[12.5px] text-[color:var(--ink-3)]">
              Employees with these email domains can self-register and join this org.
            </p>
          </label>

          <label className="block">
            <span className={LABEL_CLASS}>Head office</span>
            <input
              {...register("headOffice")}
              className={INPUT_CLASS}
              placeholder="Infocity, Gandhinagar"
            />
            {fieldError("headOffice") && (
              <p className="mt-1.5 text-[12.5px] text-[color:var(--destructive)]">{fieldError("headOffice")}</p>
            )}
          </label>
        </div>
      </section>

      {/* Carpooling configuration */}
      <section className={`${coCard} p-5 sm:p-6`}>
        <div className="mb-5">
          <h3 className="m-0 font-display text-[17px] font-semibold text-[color:var(--ink)]">
            Carpooling configuration
          </h3>
          <p className="m-0 mt-1 text-[13px] text-[color:var(--ink-3)]">
            Cost parameters used by ride pricing and financial reports.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={LABEL_CLASS}>Fuel cost / litre (₹)</span>
            <input
              {...register("fuelCostPerKm")}
              type="number"
              step="0.01"
              className={INPUT_CLASS}
              placeholder="7.50"
            />
            {fieldError("fuelCostPerKm") && (
              <p className="mt-1.5 text-[12.5px] text-[color:var(--destructive)]">{fieldError("fuelCostPerKm")}</p>
            )}
          </label>

          <label className="block">
            <span className={LABEL_CLASS}>Travel cost / km (₹)</span>
            <input
              {...register("travelCostPerKm")}
              type="number"
              step="0.01"
              className={INPUT_CLASS}
              placeholder="12.00"
            />
            {fieldError("travelCostPerKm") && (
              <p className="mt-1.5 text-[12.5px] text-[color:var(--destructive)]">{fieldError("travelCostPerKm")}</p>
            )}
          </label>

          <label className="block">
            <span className={LABEL_CLASS}>Currency</span>
            <input {...register("currency")} className={INPUT_CLASS} placeholder="INR" />
            {fieldError("currency") && (
              <p className="mt-1.5 text-[12.5px] text-[color:var(--destructive)]">{fieldError("currency")}</p>
            )}
          </label>

          <label className="block">
            <span className={LABEL_CLASS}>Monthly maintenance (₹)</span>
            <input
              {...register("maintenanceMonthly")}
              type="number"
              step="0.01"
              className={INPUT_CLASS}
              placeholder="15000"
            />
            {fieldError("maintenanceMonthly") && (
              <p className="mt-1.5 text-[12.5px] text-[color:var(--destructive)]">
                {fieldError("maintenanceMonthly")}
              </p>
            )}
          </label>
        </div>

        {/* Auto-approve vehicles */}
        <div className="mt-4 flex items-center gap-4 rounded-[10px] border border-[color:var(--line)] bg-[color:var(--surface-2)] p-3.5">
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold text-[color:var(--ink)]">Auto-approve vehicles</div>
            <div className="text-[12.5px] text-[color:var(--ink-3)]">
              Skip manual review for known domains
            </div>
          </div>
          <PillSwitch
            checked={autoApprove}
            onChange={(v) => setValue("autoApproveDomain", v)}
            label="Auto-approve vehicles"
          />
        </div>
      </section>

      {error && <p className="text-[13px] text-[color:var(--destructive)]">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          id="save-settings-btn"
          className={`${coAmberBtn} px-5 py-3 text-[15px]`}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : null}
          {saving ? "Saving…" : saved ? "Saved" : "Save configuration"}
        </button>
        {saved && (
          <p className="text-[13px] text-[color:var(--ink-3)]">
            Settings saved. Reports will use the updated cost values.
          </p>
        )}
      </div>
    </form>
  );
}
