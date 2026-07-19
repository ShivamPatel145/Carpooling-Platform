"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { coAmberBtn } from "@/components/co/ui";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * The Stripe-dependent slice of the wallet recharge flow, split out so the whole `@stripe/*` React
 * tree loads LAZILY (via next/dynamic ssr:false) only once a PaymentIntent clientSecret exists —
 * not eagerly compiled/bundled on every /wallet route visit. Shared by both recharge entry points
 * (recharge-dialog + wallet-recharge); `variant` picks the matching button styling.
 *
 * stripePromise is null when no publishable key is configured — callers guard before rendering, but
 * we also render nothing so a stray mount can't throw.
 */
const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = pk ? loadStripe(pk) : null;

function InnerForm({
  onSuccess,
  variant,
}: {
  onSuccess: () => void;
  variant: "default" | "amber";
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/wallet` },
      redirect: "if_required",
    });
    setBusy(false);
    if (error) {
      toast({ variant: "destructive", title: "Payment failed", description: error.message });
    } else {
      toast({ variant: "success", title: "Wallet recharged", description: "Your balance is updated." });
      onSuccess();
    }
  }

  if (variant === "amber") {
    return (
      <form onSubmit={submit} className="space-y-5">
        <PaymentElement />
        <button
          type="submit"
          disabled={busy || !stripe}
          className={cn(coAmberBtn, "w-full px-4 py-2.5 text-[14px]")}
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Pay now
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <PaymentElement />
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={busy || !stripe || !elements}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirm Payment
        </Button>
      </div>
    </form>
  );
}

export function StripeCheckout({
  clientSecret,
  onSuccess,
  variant = "default",
}: {
  clientSecret: string;
  onSuccess: () => void;
  variant?: "default" | "amber";
}) {
  if (!stripePromise) return null;
  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
      <InnerForm onSuccess={onSuccess} variant={variant} />
    </Elements>
  );
}
