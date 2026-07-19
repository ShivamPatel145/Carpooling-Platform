"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

/**
 * The Stripe-dependent slice of the payment flow, split out so the whole `@stripe/*` React tree is
 * loaded LAZILY (via next/dynamic ssr:false from payment-form.tsx) only once the user has a
 * PaymentIntent clientSecret — not eagerly compiled/bundled on every /pay/* route visit.
 *
 * stripePromise is null when no publishable key is configured — we render nothing so a stray mount
 * can't throw (mirrors the wallet checkout). `loadStripe(undefined)` otherwise rejects, and that
 * rejection surfaces from the lazily-mounted Elements tree as an opaque serialized `Error: {}`.
 */
const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = pk ? loadStripe(pk) : null;

function CheckoutForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/history` },
      redirect: "if_required",
    });
    setIsProcessing(false);

    if (error) {
      toast({ variant: "destructive", title: "Payment failed", description: error.message });
    } else {
      toast({ variant: "success", title: "Payment successful", description: "Trip has been paid." });
      onSuccess();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isProcessing || !stripe || !elements}>
          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirm Payment
        </Button>
      </div>
    </form>
  );
}

export function StripeCheckout({
  clientSecret,
  onSuccess,
}: {
  clientSecret: string;
  onSuccess: () => void;
}) {
  if (!stripePromise) return null;
  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
      <CheckoutForm onSuccess={onSuccess} />
    </Elements>
  );
}
