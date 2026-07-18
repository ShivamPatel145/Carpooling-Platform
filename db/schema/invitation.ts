import { index, pgEnum, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { timestamps } from "./_shared";
import { organization } from "./organization";
import { userRoleEnum } from "./user";

/**
 * invitation — backs onboarding Paths 1 & 2 (docs/PRD.md §4.3). A tokenized link pre-binds orgId +
 * role. Path 1: super_admin invites a company_admin. Path 2: company_admin invites an employee.
 */
export const invitationStatusEnum = pgEnum("invitation_status", ["pending", "accepted", "expired"]);
export type InvitationStatus = (typeof invitationStatusEnum.enumValues)[number];

export const invitation = pgTable(
  "invitation",
  {
    ...timestamps,
    orgId: uuid("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: userRoleEnum("role").notNull().default("employee"),
    token: text("token").notNull().unique(),
    status: invitationStatusEnum("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => ({
    orgIdx: index("invitation_org_idx").on(t.orgId),
    emailIdx: index("invitation_email_idx").on(t.email),
    tokenIdx: index("invitation_token_idx").on(t.token),
    statusIdx: index("invitation_status_idx").on(t.status),
  }),
);

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, { fields: [invitation.orgId], references: [organization.id] }),
}));

export type Invitation = typeof invitation.$inferSelect;
export type NewInvitation = typeof invitation.$inferInsert;

export const invitationSelectSchema = createSelectSchema(invitation);
export const invitationInsertSchema = createInsertSchema(invitation).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  token: true,
  status: true,
});

/** Form: invite someone by email + role. Token/expiry are server-generated. */
export const inviteFormSchema = z.object({
  email: z.string().email("A valid email is required"),
  role: z.enum(userRoleEnum.enumValues).default("employee"),
});
export type InviteFormValues = z.infer<typeof inviteFormSchema>;

/** Accept-invite: set a password (name optional if the invite had none). */
export const acceptInviteSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1).max(120),
  password: z.string().min(8, "At least 8 characters").max(200),
  phone: z.string().max(20).optional().or(z.literal("")),
});
export type AcceptInviteValues = z.infer<typeof acceptInviteSchema>;
