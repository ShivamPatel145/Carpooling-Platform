import { index, jsonb, text } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { timestamps } from "./_shared";

/**
 * GENERIC key/value settings store. Slice C (admin) manages these. Value is jsonb so a setting
 * can be a string, number, boolean, or object without a schema change. `category` groups related
 * settings on the admin screen.
 */
export const systemSetting = pgTable(
  "system_setting",
  {
    ...timestamps,
    key: text("key").notNull().unique(),
    value: jsonb("value").$type<unknown>(),
    category: text("category").notNull().default("general"),
    label: text("label"),
    description: text("description"),
  },
  (t) => ({
    keyIdx: index("system_setting_key_idx").on(t.key),
    categoryIdx: index("system_setting_category_idx").on(t.category),
  }),
);

export type SystemSetting = typeof systemSetting.$inferSelect;
export type NewSystemSetting = typeof systemSetting.$inferInsert;

export const systemSettingSelectSchema = createSelectSchema(systemSetting);
export const systemSettingInsertSchema = createInsertSchema(systemSetting, {
  key: (s) => s.min(1, "Key is required").regex(/^[a-z0-9._-]+$/i, "Use letters, numbers, . _ -"),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const systemSettingFormSchema = systemSettingInsertSchema.extend({
  // Accept any JSON-serialisable value from the form; the API validates shape per-key.
  value: z.any(),
});
export type SystemSettingFormValues = z.infer<typeof systemSettingFormSchema>;
