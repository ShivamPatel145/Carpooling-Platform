import { index, numeric, text, uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { timestamps } from "./_shared";
import { organization } from "./organization";
import { user } from "./user";

/**
 * walletEntry — APPEND-ONLY ledger (docs/PRD.md §7.8, D8). Balance = sum(delta). A recharge is a
 * positive entry (funded by Stripe); paying from balance is a negative entry; a refund is positive.
 * balanceAfter is denormalized for fast display + audit. Never UPDATE or DELETE rows here. Slice C.
 */
export const walletEntry = pgTable(
  "wallet_entry",
  {
    ...timestamps,
    orgId: uuid("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** signed amount: + for recharge/refund, - for spend */
    delta: numeric("delta", { precision: 12, scale: 2 }).notNull(),
    /** e.g. "recharge" | "ride_payment" | "refund" */
    reason: text("reason").notNull(),
    /** reference to the thing that caused it (bookingId, paymentId, …) */
    refId: uuid("ref_id"),
    /** running balance after this entry — computed at insert time */
    balanceAfter: numeric("balance_after", { precision: 12, scale: 2 }).notNull(),
  },
  (t) => ({
    orgIdx: index("wallet_entry_org_idx").on(t.orgId),
    userIdx: index("wallet_entry_user_idx").on(t.userId),
    createdIdx: index("wallet_entry_created_idx").on(t.createdAt),
  }),
);

export const walletEntryRelations = relations(walletEntry, ({ one }) => ({
  organization: one(organization, { fields: [walletEntry.orgId], references: [organization.id] }),
  user: one(user, { fields: [walletEntry.userId], references: [user.id] }),
}));

export type WalletEntry = typeof walletEntry.$inferSelect;
export type NewWalletEntry = typeof walletEntry.$inferInsert;

export const walletEntrySelectSchema = createSelectSchema(walletEntry);

/** Recharge form: amount + method (Card/UPI via Stripe). */
export const rechargeFormSchema = z.object({
  amount: z.coerce.number().min(1, "Enter an amount").max(1_000_000),
  method: z.enum(["card", "upi"]),
});
export type RechargeFormValues = z.infer<typeof rechargeFormSchema>;
