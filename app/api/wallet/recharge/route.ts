import Stripe from "stripe";
import { requirePermission } from "@/lib/permissions";
import { withErrorHandler, ok } from "@/lib/api";
import { rechargeFormSchema } from "@/features/wallet/schema";
import { logActivity } from "@/lib/activity";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20", // or whatever the latest/default is
});

/**
 * POST /api/wallet/recharge
 * Initiates a Stripe PaymentIntent for a wallet recharge.
 */
export const POST = withErrorHandler(async (req: Request) => {
  const { session, tenant } = await requirePermission("wallet", "recharge");
  const values = rechargeFormSchema.parse(await req.json());

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(values.amount * 100), // Stripe expects cents/paise
    currency: "inr", // Should use the org currency eventually, hardcoded to INR for now as per spec
    metadata: {
      action: "wallet_recharge",
      userId: session.user.id,
      orgId: tenant.orgId,
      amount: values.amount.toString(),
      method: values.method,
    },
    // If UPI, we might need to specify payment_method_types: ['card', 'upi']
    payment_method_types: values.method === "upi" ? ["upi"] : ["card"],
  });

  await logActivity({
    orgId: tenant.orgId,
    actorId: session.user.id,
    action: "create",
    resource: "wallet",
    metadata: { action: "initiated_recharge", amount: values.amount, method: values.method },
    req,
  });

  return ok({ clientSecret: paymentIntent.client_secret });
});
