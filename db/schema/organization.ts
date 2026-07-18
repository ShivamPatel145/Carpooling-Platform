import { boolean, index, jsonb, numeric, text } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { timestamps } from "./_shared";

/**
 * organization — THE TENANT ROOT (carpooling). The one domain table with NO orgId (it IS the org).
 * A user's orgId is set once at join time (domain match or accepted invite) and is immutable.
 * Cost config here (fuel/travel per unit, maintenance) flows into Slice C's computed reports.
 * See docs/PRD.md §5 (tenancy) + §6, and drizzle-schema/carpooling.md.
 */
export const organization = pgTable(
  "organization",
  {
    ...timestamps,
    name: text("name").notNull(),
    /** email domains that auto-map a self-registering employee to this org (Path 3) */
    allowedEmailDomains: text("allowed_email_domains").array().notNull().default([]),
    currency: text("currency").notNull().default("INR"),
    /** ₹ per litre of fuel — used with distance to compute fuel cost in reports */
    fuelCostPerKm: numeric("fuel_cost_per_km", { precision: 10, scale: 2 }).notNull().default("0"),
    /** ₹ per km travel cost — reporting/pricing input */
    travelCostPerKm: numeric("travel_cost_per_km", { precision: 10, scale: 2 }).notNull().default("0"),
    /** monthly maintenance line item for the Financial Summary */
    maintenanceMonthly: numeric("maintenance_monthly", { precision: 12, scale: 2 }).notNull().default("0"),
    /** if true, a domain-matched signup is active immediately; else it waits in the approval queue */
    autoApproveDomain: boolean("auto_approve_domain").notNull().default(false),
    /** company details + any extra config (industry, registered office, contact, …) */
    settings: jsonb("settings").$type<Record<string, unknown>>(),
  },
  (t) => ({
    nameIdx: index("organization_name_idx").on(t.name),
  }),
);

export type Organization = typeof organization.$inferSelect;
export type NewOrganization = typeof organization.$inferInsert;

export const organizationSelectSchema = createSelectSchema(organization);
export const organizationInsertSchema = createInsertSchema(organization, {
  name: (s) => s.min(2, "Company name is required").max(160),
}).omit({ id: true, createdAt: true, updatedAt: true });

/** Admin/super-admin form for org create + settings. */
export const organizationFormSchema = z.object({
  name: z.string().min(2, "Company name is required").max(160),
  allowedEmailDomains: z.array(z.string().min(3)).default([]),
  currency: z.string().min(1).max(8).default("INR"),
  fuelCostPerKm: z.coerce.number().min(0).max(100000),
  travelCostPerKm: z.coerce.number().min(0).max(100000),
  maintenanceMonthly: z.coerce.number().min(0),
  autoApproveDomain: z.boolean().default(false),
});
export type OrganizationFormValues = z.infer<typeof organizationFormSchema>;
