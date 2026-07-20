import { index, integer, pgEnum, text, uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { timestamps } from "./_shared";
import { organization } from "./organization";
import { user } from "./user";

/**
 * vehicle — an employee's registered car (docs/PRD.md §7.10, D9). Only APPROVED vehicles are
 * selectable when publishing a ride. A company_admin can approve, or register one on an employee's
 * behalf (registeredByAdminId). Built on the generic CRUD pattern (Slice A owns; approval surface D).
 */
export const vehicleApprovalStatusEnum = pgEnum("vehicle_approval_status", ["approved", "inactive", "rejected"]);
export type VehicleApprovalStatus = (typeof vehicleApprovalStatusEnum.enumValues)[number];

export const vehicle = pgTable(
  "vehicle",
  {
    ...timestamps,
    orgId: uuid("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    model: text("model").notNull(),
    registrationNo: text("registration_no").notNull(),
    seatingCapacity: integer("seating_capacity").notNull().default(4),
    approvalStatus: vehicleApprovalStatusEnum("approval_status").notNull().default("inactive"),
    /** set when an admin registered the vehicle on the owner's behalf */
    registeredByAdminId: uuid("registered_by_admin_id").references(() => user.id, {
      onDelete: "set null",
    }),
  },
  (t) => ({
    orgIdx: index("vehicle_org_idx").on(t.orgId),
    ownerIdx: index("vehicle_owner_idx").on(t.ownerId),
    statusIdx: index("vehicle_status_idx").on(t.approvalStatus),
  }),
);

export const vehicleRelations = relations(vehicle, ({ one }) => ({
  organization: one(organization, { fields: [vehicle.orgId], references: [organization.id] }),
  owner: one(user, { fields: [vehicle.ownerId], references: [user.id] }),
}));

export type Vehicle = typeof vehicle.$inferSelect;
export type NewVehicle = typeof vehicle.$inferInsert;

export const vehicleSelectSchema = createSelectSchema(vehicle);
export const vehicleInsertSchema = createInsertSchema(vehicle).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  orgId: true,
  ownerId: true,
  registeredByAdminId: true,
});

/** Form shared by employee (add/edit own) and admin (register on behalf). */
export const vehicleFormSchema = z.object({
  model: z.string().min(2, "Model is required").max(120),
  registrationNo: z.string().min(3, "Registration number is required").max(32),
  seatingCapacity: z.coerce.number().int().min(1, "At least 1 seat").max(20),
  approvalStatus: z.enum(vehicleApprovalStatusEnum.enumValues).optional(),
});
export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;
