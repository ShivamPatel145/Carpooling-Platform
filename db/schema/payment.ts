import { index, numeric, pgEnum, text, uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { timestamps } from "./_shared";
import { organization } from "./organization";
import { user } from "./user";
import { booking } from "./booking";

/**
 * payment — one per booking on trip completion (docs/PRD.md §7.8, §6). Method = cash/card/upi/wallet/qr.
 * Stripe confirmations arrive via webhook at /api/stripe/webhook and update status. Slice C.
 *
 * `qr` is a direct UPI transfer: the passenger scans the driver's payee QR and pays them bank-to-bank,
 * then confirms — so it settles off-platform, exactly like cash (no wallet/Stripe movement).
 */
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "card", "upi", "wallet", "qr"]);
export type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number];

export const paymentStatusEnum = pgEnum("payment_status", ["pending", "succeeded", "failed", "refunded"]);
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];

export const payment = pgTable(
  "payment",
  {
    ...timestamps,
    orgId: uuid("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => booking.id, { onDelete: "cascade" }),
    payerId: uuid("payer_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    method: paymentMethodEnum("method").notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    status: paymentStatusEnum("status").notNull().default("pending"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
  },
  (t) => ({
    orgIdx: index("payment_org_idx").on(t.orgId),
    bookingIdx: index("payment_booking_idx").on(t.bookingId),
    payerIdx: index("payment_payer_idx").on(t.payerId),
    statusIdx: index("payment_status_idx").on(t.status),
    intentIdx: index("payment_intent_idx").on(t.stripePaymentIntentId),
  }),
);

export const paymentRelations = relations(payment, ({ one }) => ({
  organization: one(organization, { fields: [payment.orgId], references: [organization.id] }),
  booking: one(booking, { fields: [payment.bookingId], references: [booking.id] }),
  payer: one(user, { fields: [payment.payerId], references: [user.id] }),
}));

export type Payment = typeof payment.$inferSelect;
export type NewPayment = typeof payment.$inferInsert;

export const paymentSelectSchema = createSelectSchema(payment);

/** Pay-for-a-trip form: choose a method for a booking. */
export const paymentFormSchema = z.object({
  bookingId: z.string().uuid(),
  method: z.enum(paymentMethodEnum.enumValues),
});
export type PaymentFormValues = z.infer<typeof paymentFormSchema>;
