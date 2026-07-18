import { boolean, index, integer, pgEnum, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { timestamps } from "./_shared";
import { user } from "./user";

/**
 * demoEntity — THE COPY TEMPLATE. This is a complete, tested reference of the full CRUD pattern.
 * Tomorrow every slice copies features/_demo/ and renames it to a real domain entity. So this
 * table deliberately exercises EVERY field type a form primitive supports:
 *   text (name) · long text (description) · enum (status) · number (amount) · date (dueDate) ·
 *   boolean (isPinned) · optional file url (attachmentUrl) · owner FK (ownerId).
 *
 * It also carries the ownership column (ownerId) that the RBAC canEdit/canDelete helpers key off.
 * Do NOT delete this after build-day — it stays as the living reference.
 */
export const demoStatusEnum = pgEnum("demo_status", ["draft", "active", "archived"]);
export type DemoStatus = (typeof demoStatusEnum.enumValues)[number];

export const demoEntity = pgTable(
  "demo_entity",
  {
    ...timestamps,
    /** ownership — RBAC canEdit/canDelete key off this vs the session user id */
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    status: demoStatusEnum("status").notNull().default("draft"),
    /** integer minor units (e.g. cents) — mono/tabular in the DataTable */
    amount: integer("amount").notNull().default(0),
    dueDate: timestamp("due_date", { withTimezone: true }),
    isPinned: boolean("is_pinned").notNull().default(false),
    /** UploadThing file url — proves the file-upload form primitive */
    attachmentUrl: text("attachment_url"),
  },
  (t) => ({
    ownerIdx: index("demo_entity_owner_idx").on(t.ownerId),
    statusIdx: index("demo_entity_status_idx").on(t.status),
    nameIdx: index("demo_entity_name_idx").on(t.name),
    createdAtIdx: index("demo_entity_created_at_idx").on(t.createdAt),
  }),
);

export const demoEntityRelations = relations(demoEntity, ({ one }) => ({
  owner: one(user, { fields: [demoEntity.ownerId], references: [user.id] }),
}));

export type DemoEntity = typeof demoEntity.$inferSelect;
export type NewDemoEntity = typeof demoEntity.$inferInsert;

// ── ONE Zod schema, imported by BOTH the API route and the form (generic-crud skill) ────────
export const demoEntitySelectSchema = createSelectSchema(demoEntity);

/** The write schema shared by the create/edit form and the API route. */
export const demoEntityFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(120),
  description: z.string().max(2000).optional().or(z.literal("")),
  status: z.enum(demoStatusEnum.enumValues).default("draft"),
  amount: z.coerce
    .number({ invalid_type_error: "Amount must be a number" })
    .int("Whole numbers only")
    .min(0, "Amount cannot be negative")
    .max(1_000_000_000),
  dueDate: z.coerce.date().optional().nullable(),
  isPinned: z.boolean().default(false),
  attachmentUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});
export type DemoEntityFormValues = z.infer<typeof demoEntityFormSchema>;

/** Server-side insert schema (adds owner, which the route supplies from the session). */
export const demoEntityInsertSchema = createInsertSchema(demoEntity).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
