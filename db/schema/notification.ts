import { boolean, index, pgEnum, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { timestamps } from "./_shared";
import { user } from "./user";

/**
 * GENERIC notification table. Every slice that needs to notify a user INSERTS here with a
 * reference to its own entity — never build a `<yourEntity>Notification`. A second parallel
 * notification system is a reviewer's favourite thing to find (drizzle-schema skill).
 */
export const notificationTypeEnum = pgEnum("notification_type", [
  "info",
  "success",
  "warning",
  "error",
]);
export type NotificationType = (typeof notificationTypeEnum.enumValues)[number];

export const notification = pgTable(
  "notification",
  {
    ...timestamps,
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull().default("info"),
    title: text("title").notNull(),
    body: text("body"),
    /** deep link into the app, e.g. /manager/orders/<id> */
    href: text("href"),
    /** the entity this refers to, for grouping/filtering — e.g. "order" */
    resource: text("resource"),
    resourceId: uuid("resource_id"),
    readAt: timestamp("read_at", { withTimezone: true }),
    isRead: boolean("is_read").notNull().default(false),
  },
  (t) => ({
    userIdx: index("notification_user_idx").on(t.userId),
    userUnreadIdx: index("notification_user_unread_idx").on(t.userId, t.isRead),
  }),
);

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, { fields: [notification.userId], references: [user.id] }),
}));

export type Notification = typeof notification.$inferSelect;
export type NewNotification = typeof notification.$inferInsert;

export const notificationSelectSchema = createSelectSchema(notification);
export const notificationInsertSchema = createInsertSchema(notification).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isRead: true,
  readAt: true,
});
