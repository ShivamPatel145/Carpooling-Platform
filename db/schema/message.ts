import { index, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { timestamps } from "./_shared";
import { organization } from "./organization";
import { trip } from "./trip";
import { user } from "./user";

/**
 * message — per-trip chat, delivered over the same Pusher channel as tracking (one realtime
 * system — docs/PRD.md §7.7). Unread state via readAt. Slice B.
 */
export const message = pgTable(
  "message",
  {
    ...timestamps,
    orgId: uuid("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (t) => ({
    orgIdx: index("message_org_idx").on(t.orgId),
    tripIdx: index("message_trip_idx").on(t.tripId),
    senderIdx: index("message_sender_idx").on(t.senderId),
  }),
);

export const messageRelations = relations(message, ({ one }) => ({
  organization: one(organization, { fields: [message.orgId], references: [organization.id] }),
  trip: one(trip, { fields: [message.tripId], references: [trip.id] }),
  sender: one(user, { fields: [message.senderId], references: [user.id] }),
}));

export type Message = typeof message.$inferSelect;
export type NewMessage = typeof message.$inferInsert;

export const messageSelectSchema = createSelectSchema(message);
export const messageFormSchema = z.object({
  tripId: z.string().uuid(),
  body: z.string().min(1, "Message can't be empty").max(2000),
});
export type MessageFormValues = z.infer<typeof messageFormSchema>;
