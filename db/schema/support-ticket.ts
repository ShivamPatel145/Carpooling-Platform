import { index, pgEnum, text, uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { timestamps } from "./_shared";
import { user } from "./user";
import { organization } from "./organization";
import { ride } from "./ride";

/**
 * Support / report ticket flow. Now org-scoped (carpooling tenancy). "Report an issue" on a ride
 * links here via rideId (D11); generic issues leave rideId null. Slice D owns the UI.
 */
export const ticketStatusEnum = pgEnum("ticket_status", [
  "open",
  "in_progress",
  "resolved",
  "closed",
]);
export type TicketStatus = (typeof ticketStatusEnum.enumValues)[number];

export const ticketPriorityEnum = pgEnum("ticket_priority", ["low", "medium", "high", "urgent"]);
export type TicketPriority = (typeof ticketPriorityEnum.enumValues)[number];

export const supportTicket = pgTable(
  "support_ticket",
  {
    ...timestamps,
    /** tenant — nullable so a platform-level ticket (super-admin) can exist without an org */
    orgId: uuid("org_id").references(() => organization.id, { onDelete: "cascade" }),
    /** who raised it */
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** who it's assigned to (nullable until triaged) */
    assigneeId: uuid("assignee_id").references(() => user.id, { onDelete: "set null" }),
    subject: text("subject").notNull(),
    description: text("description").notNull(),
    status: ticketStatusEnum("status").notNull().default("open"),
    priority: ticketPriorityEnum("priority").notNull().default("medium"),
    /** "Report an issue" on a ride links here (D11); null for generic tickets */
    rideId: uuid("ride_id").references(() => ride.id, { onDelete: "set null" }),
    /** optional link back to any other domain entity */
    resource: text("resource"),
    resourceId: uuid("resource_id"),
  },
  (t) => ({
    orgIdx: index("support_ticket_org_idx").on(t.orgId),
    requesterIdx: index("support_ticket_requester_idx").on(t.requesterId),
    assigneeIdx: index("support_ticket_assignee_idx").on(t.assigneeId),
    statusIdx: index("support_ticket_status_idx").on(t.status),
    priorityIdx: index("support_ticket_priority_idx").on(t.priority),
    rideIdx: index("support_ticket_ride_idx").on(t.rideId),
  }),
);

export const supportTicketRelations = relations(supportTicket, ({ one }) => ({
  organization: one(organization, {
    fields: [supportTicket.orgId],
    references: [organization.id],
  }),
  ride: one(ride, { fields: [supportTicket.rideId], references: [ride.id] }),
  requester: one(user, {
    fields: [supportTicket.requesterId],
    references: [user.id],
    relationName: "ticket_requester",
  }),
  assignee: one(user, {
    fields: [supportTicket.assigneeId],
    references: [user.id],
    relationName: "ticket_assignee",
  }),
}));

export type SupportTicket = typeof supportTicket.$inferSelect;
export type NewSupportTicket = typeof supportTicket.$inferInsert;

export const supportTicketSelectSchema = createSelectSchema(supportTicket);
export const supportTicketInsertSchema = createInsertSchema(supportTicket, {
  subject: (s) => s.min(3, "Subject must be at least 3 characters").max(160),
  description: (s) => s.min(10, "Please describe the issue (10+ characters)"),
}).omit({ id: true, createdAt: true, updatedAt: true, requesterId: true, orgId: true });

export const supportTicketFormSchema = supportTicketInsertSchema.extend({
  status: z.enum(ticketStatusEnum.enumValues).optional(),
  priority: z.enum(ticketPriorityEnum.enumValues),
});
export type SupportTicketFormValues = z.infer<typeof supportTicketFormSchema>;
