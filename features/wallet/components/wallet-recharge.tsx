"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useRechargeWallet } from "@/features/wallet/hooks";
import { coAmberBtn } from "@/components/co/ui";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const PRESETS = [200, 500, 1000] as const;
const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = pk ? loadStripe(pk) : null;

/**
 * Coride wallet recharge — the comp's quick-amount panel (₹200 / ₹500 / ₹1000 + "Add via UPI").
 * Picks a preset, initiates a Stripe PaymentIntent through the existing /api/wallet/recharge route,
 * then confirms in a Stripe Elements dialog. On success the wallet queries are invalidated.
 */
export function WalletRecharge() {
  const [amount, setAmount] = React.useState<number>(500);
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const initiate = useRechargeWallet();
  const qc = useQueryClient();

  async function start() {
    if (!stripePromise) {
      toast({
        variant: "destructive",
        title: "Payments not configured",
        description: "Add a Stripe publishable key to enable wallet top-ups.",
      });
      return;
    }
    const res = await initiate.mutateAsync({ amount, method: "upi" });
    if (res?.clientSecret) setClientSecret(res.clientSecret);
  }

  function done() {
    setClientSecret(null);
    qc.invalidateQueries({ queryKey: ["wallet"] });
  }

  return (
    <div>
      <div className="mb-3 font-display text-[15px] font-semibold text-[color:var(--ink)]">Recharge wallet</div>
      <div className="mb-3.5 grid grid-cols-3 gap-2.5">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setAmount(p)}
            aria-pressed={amount === p}
            className={cn(
              "rounded-[10px] border py-2.5 text-center font-mono text-[15px] font-semibold transition",
              amount === p
                ? "border-[color:var(--amber-line)] bg-[color:var(--amber-tint)] text-[color:var(--amber-strong)]"
                : "border-[color:var(--line-2)] bg-[color:var(--surface)] text-[color:var(--ink-2)] hover:border-[color:var(--ink-3)]",
            )}
          >
            ₹{p}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={start}
        disabled={initiate.isPending}
        className={cn(coAmberBtn, "w-full px-4 py-2.5 text-[14px]")}
      >
        {initiate.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Add ₹{amount} via UPI
      </button>

      <Dialog open={!!clientSecret} onOpenChange={(v) => !v && setClientSecret(null)}>
        <DialogContent className="sm:max-w-[430px]">
          <DialogHeader>
            <DialogTitle>Confirm recharge</DialogTitle>
            <DialogDescription>Adding ₹{amount} to your Coride wallet.</DialogDescription>
          </DialogHeader>
          {clientSecret && stripePromise && (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
              <ConfirmForm onSuccess={done} />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConfirmForm({ onSuccess }: { onSuccess: () => void }) {
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

  return (
    <form onSubmit={submit} className="space-y-5">
      <PaymentElement />
      <button type="submit" disabled={busy || !stripe} className={cn(coAmberBtn, "w-full px-4 py-2.5 text-[14px]")}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Pay now
      </button>
    </form>
  );
}
