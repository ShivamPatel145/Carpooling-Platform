import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { payment } from "@/db/schema";
import { requirePermission, scopedWhere } from "@/lib/permissions";
import { withErrorHandler, ok } from "@/lib/api";
import { AppError, NotFoundError } from "@/lib/errors";
import { logActivity } from "@/lib/activity";
import { stripe, finalizeStripeRidePayment } from "@/lib/payments";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/payment/:id/confirm — settle a card/UPI ride payment right after the passenger confirms
 * it in the browser. We do NOT trust the client's word: we re-read the PaymentIntent straight from
 * Stripe and only credit the driver if Stripe itself says it succeeded. This is what makes the flow
 * work on localhost, where Stripe's webhook can't reach the dev server. Idempotent (see
 * finalizeStripeRidePayment), so it's safe running alongside the webhook in production.
 */
export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const { session, tenant } = await requirePermission("payment", "create");
  const { id } = await params;

  // Owner- + org-scoped: only the payer can confirm their own payment (cross-org/other → 404).
  const [p] = await db
    .select()
    .from(payment)
    .where(scopedWhere(tenant, payment, and(eq(payment.id, id), eq(payment.payerId, session.user.id))))
    .limit(1);
  if (!p) throw new NotFoundError("That payment doesn't exist.");
  if (p.status === "succeeded") return ok({ status: "succeeded" }); // already settled
  if (!p.stripePaymentIntentId) throw new AppError("This payment can't be confirmed.", 409, "NO_INTENT");

  const intent = await stripe.paymentIntents.retrieve(p.stripePaymentIntentId);
  if (intent.status === "succeeded") {
    await finalizeStripeRidePayment(p.id, true);
    await logActivity({
      orgId: tenant.orgId,
      actorId: session.user.id,
      action: "update",
      resource: "payment",
      resourceId: p.id,
      metadata: { method: p.method, status: "succeeded", via: "confirm" },
      req,
    });
    return ok({ status: "succeeded" });
  }

  return ok({ status: intent.status });
});
