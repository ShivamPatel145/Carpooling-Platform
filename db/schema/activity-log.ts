import { index, jsonb, text, uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createSelectSchema } from "drizzle-zod";
import { timestamps } from "./_shared";
import { user } from "./user";
import { organization } from "./organization";

/**
 * GENERIC audit trail. Every MUTATING route ends with logActivity() (see lib/activity.ts and the
 * rbac-guard skill). A hole in this trail is exactly what a reviewer probes. Append-only in
 * practice — never updated.
 *
 *   actor      — who did it (user id; nullable for system actions)
 *   action     — verb: "create" | "update" | "delete" | "approve" | "login" | ...
 *   resource   — the entity type: "order", "user", "setting", ...
 *   resourceId — the specific row affected
 *   metadata   — arbitrary structured context (diff, reason, amounts)
 *   ip         — request IP for security auditing
 */
export const activityLog = pgTable(
  "activity_log",
  {
    ...timestamps,
    /** tenant — nullable for platform/system actions (super-admin); scopes the admin's audit view */
    orgId: uuid("org_id").references(() => organization.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    resource: text("resource").notNull(),
    resourceId: uuid("resource_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ip: text("ip"),
    userAgent: text("user_agent"),
  },
  (t) => ({
    orgIdx: index("activity_log_org_idx").on(t.orgId),
    actorIdx: index("activity_log_actor_idx").on(t.actorId),
    resourceIdx: index("activity_log_resource_idx").on(t.resource, t.resourceId),
    createdAtIdx: index("activity_log_created_at_idx").on(t.createdAt),
  }),
);

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  organization: one(organization, { fields: [activityLog.orgId], references: [organization.id] }),
  actor: one(user, { fields: [activityLog.actorId], references: [user.id] }),
}));

export type ActivityLog = typeof activityLog.$inferSelect;
export type NewActivityLog = typeof activityLog.$inferInsert;

export const activityLogSelectSchema = createSelectSchema(activityLog);
