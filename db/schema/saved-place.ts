import { index, numeric, text, uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { timestamps } from "./_shared";
import { organization } from "./organization";
import { user } from "./user";

/**
 * savedPlace — Home/Office/custom locations (docs/PRD.md §7.14). Powers saved-place autofill and
 * the swap control on Find/Offer. Slice B owns.
 */
export const savedPlace = pgTable(
  "saved_place",
  {
    ...timestamps,
    orgId: uuid("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    lat: numeric("lat", { precision: 10, scale: 7 }).notNull(),
    lng: numeric("lng", { precision: 10, scale: 7 }).notNull(),
    address: text("address"),
  },
  (t) => ({
    orgIdx: index("saved_place_org_idx").on(t.orgId),
    userIdx: index("saved_place_user_idx").on(t.userId),
  }),
);

export const savedPlaceRelations = relations(savedPlace, ({ one }) => ({
  organization: one(organization, { fields: [savedPlace.orgId], references: [organization.id] }),
  user: one(user, { fields: [savedPlace.userId], references: [user.id] }),
}));

export type SavedPlace = typeof savedPlace.$inferSelect;
export type NewSavedPlace = typeof savedPlace.$inferInsert;

export const savedPlaceSelectSchema = createSelectSchema(savedPlace);
export const savedPlaceFormSchema = z.object({
  label: z.string().min(1, "A label is required").max(80),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  address: z.string().max(300).optional().or(z.literal("")),
});
export type SavedPlaceFormValues = z.infer<typeof savedPlaceFormSchema>;
