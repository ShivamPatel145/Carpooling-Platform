import { index, pgEnum, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { timestamps } from "./_shared";
import { organization } from "./organization";

/**
 * Roles — CARPOOLING (docs/PRD.md §4). Numeric hierarchy lives in lib/permissions.ts, NOT here.
 *
 *   super_admin   — platform operator; cross-tenant (the one isolation exception). No orgId.
 *   company_admin — one per org; configuration only, no ride operations. Scoped to own orgId.
 *   employee      — the primary user, a mode-switcher (offer vs find). Scoped to orgId + own records.
 */
export const userRoleEnum = pgEnum("user_role", ["super_admin", "company_admin", "employee"]);
export type UserRole = (typeof userRoleEnum.enumValues)[number];

/** Membership lifecycle: pending → active (approved) or inactive (deactivated). */
export const userStatusEnum = pgEnum("user_status", ["pending", "active", "inactive"]);
export type UserStatus = (typeof userStatusEnum.enumValues)[number];

/** Admin-controlled platform access (independent of status): active or revoked. */
export const platformAccessEnum = pgEnum("platform_access", ["active", "revoked"]);
export type PlatformAccess = (typeof platformAccessEnum.enumValues)[number];

export const user = pgTable(
  "user",
  {
    ...timestamps,
    /** tenant — nullable ONLY for super_admin (who is cross-tenant). Set once at join, immutable. */
    orgId: uuid("org_id").references(() => organization.id, { onDelete: "cascade" }),
    name: text("name"),
    email: text("email").notNull().unique(),
    emailVerified: timestamp("email_verified", { withTimezone: true }),
    /** avatar / profile photo (UploadThing url or OAuth image). Auth.js adapter field. */
    image: text("image"),
    phone: text("phone"),
    /** scrypt hash for the credentials provider; null for OAuth-only accounts. */
    passwordHash: text("password_hash"),
    role: userRoleEnum("role").notNull().default("employee"),
    status: userStatusEnum("status").notNull().default("pending"),
    platformAccess: platformAccessEnum("platform_access").notNull().default("active"),
    // employee record depth (wireframe Employee Details)
    department: text("department"),
    manager: text("manager"),
    officeLocation: text("office_location"),
  },
  (t) => ({
    emailIdx: index("user_email_idx").on(t.email),
    orgIdx: index("user_org_idx").on(t.orgId),
    roleIdx: index("user_role_idx").on(t.role),
    statusIdx: index("user_status_idx").on(t.status),
  }),
);

export const userRelations = relations(user, ({ one }) => ({
  organization: one(organization, { fields: [user.orgId], references: [organization.id] }),
}));

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

// ── Zod: one source per entity, shared by API + forms (drizzle-schema skill) ────────────────
export const userSelectSchema = createSelectSchema(user);
export const userInsertSchema = createInsertSchema(user, {
  email: (s) => s.email("A valid email is required"),
  name: (s) => s.min(1, "Name is required").max(120),
}).omit({ id: true, createdAt: true, updatedAt: true, passwordHash: true, emailVerified: true });

/** Public self-registration (Path 3): name/email/password/phone + optional avatar. */
export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("A valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  phone: z.string().min(6, "A valid phone number is required").max(20).optional().or(z.literal("")),
  image: z.string().url().optional().or(z.literal("")),
});
export type RegisterValues = z.infer<typeof registerSchema>;

/** Admin-facing form: create/edit an employee record. */
export const userFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email(),
  phone: z.string().max(20).optional().or(z.literal("")),
  role: z.enum(userRoleEnum.enumValues),
  status: z.enum(userStatusEnum.enumValues),
  platformAccess: z.enum(platformAccessEnum.enumValues),
  department: z.string().max(120).optional().or(z.literal("")),
  manager: z.string().max(120).optional().or(z.literal("")),
  officeLocation: z.string().max(160).optional().or(z.literal("")),
});
export type UserFormValues = z.infer<typeof userFormSchema>;
