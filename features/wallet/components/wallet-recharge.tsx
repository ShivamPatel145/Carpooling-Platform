"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useRechargeWallet, useSimulateRecharge } from "@/features/wallet/hooks";
import { coAmberBtn } from "@/components/co/ui";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import QRCode from "react-qr-code";
import { useRouter } from "next/navigation";

// The `@stripe/*` React tree is loaded lazily (client-only), reached only after a clientSecret
// exists, so /wallet no longer eagerly compiles/bundles Stripe on first visit.
const StripeCheckout = dynamic(
  () => import("./stripe-checkout").then((m) => m.StripeCheckout),
  { ssr: false, loading: () => <Loader2 className="mx-auto h-5 w-5 animate-spin" /> },
);

const PRESETS = [200, 500, 1000] as const;
const stripeConfigured = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

/**
 * Coride wallet recharge — the comp's quick-amount panel (₹200 / ₹500 / ₹1000 + "Add via UPI").
 * Picks a preset, initiates a Stripe PaymentIntent through the existing /api/wallet/recharge route,
 * then confirms in a Stripe Elements dialog. On success the wallet queries are invalidated.
 */
export function WalletRecharge() {
  const [amount, setAmount] = React.useState<number>(500);
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [showNativeQR, setShowNativeQR] = React.useState(false);
  const initiate = useRechargeWallet();
  const simulateRecharge = useSimulateRecharge();
  const qc = useQueryClient();
  const router = useRouter();

  async function startStripe() {
    if (!stripeConfigured) {
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

  async function simulateNativePayment() {
    await simulateRecharge.mutateAsync(amount);
    toast({ variant: "success", title: "Wallet recharged", description: "Your balance is updated natively." });
    setShowNativeQR(false);
    qc.invalidateQueries({ queryKey: ["wallet"] });
    router.refresh();
  }

  function done() {
    setClientSecret(null);
    qc.invalidateQueries({ queryKey: ["wallet"] });
  }

  const nativeUpiLink = `upi://pay?pa=coride@upi&pn=Coride&am=${amount}&cu=INR`;

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
      <div className="flex gap-2">
        <button
          type="button"
          onClick={startStripe}
          disabled={initiate.isPending}
          className={cn(coAmberBtn, "flex-1 px-4 py-2.5 text-[14px]")}
        >
          {initiate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />}
          Stripe UPI
        </button>
        <button
          type="button"
          onClick={() => setShowNativeQR(true)}
          className="flex-1 rounded-[10px] border border-[color:var(--line-2)] bg-[color:var(--surface)] text-[color:var(--ink-2)] hover:border-[color:var(--ink-3)] font-semibold text-[14px] px-4 py-2.5 transition"
        >
          Native QR
        </button>
      </div>

      {/* Native QR Modal */}
      <Dialog open={showNativeQR} onOpenChange={setShowNativeQR}>
        <DialogContent className="sm:max-w-[360px] text-center">
          <DialogHeader>
            <DialogTitle className="text-center">Scan to Pay ₹{amount}</DialogTitle>
            <DialogDescription className="text-center">Use any UPI app (GPay, PhonePe, Paytm)</DialogDescription>
          </DialogHeader>
          {/* white background is intentional — UPI QR scanners need a light, high-contrast field in any theme */}
          <div className="flex justify-center p-4 bg-white rounded-xl my-4">
            <QRCode value={nativeUpiLink} size={200} />
          </div>
          <p className="text-xs text-[color:var(--ink-3)] mb-4 font-mono break-all bg-[color:var(--surface-2)] p-2 rounded">
            {nativeUpiLink}
          </p>
          <button
            type="button"
            onClick={simulateNativePayment}
            disabled={simulateRecharge.isPending}
            className={cn(coAmberBtn, "w-full px-4 py-2.5 text-[14px]")}
          >
            {simulateRecharge.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />}
            Simulate Payment Success
          </button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!clientSecret} onOpenChange={(v) => !v && setClientSecret(null)}>
        <DialogContent className="sm:max-w-[430px]">
          <DialogHeader>
            <DialogTitle>Confirm recharge</DialogTitle>
            <DialogDescription>Adding ₹{amount} to your Coride wallet.</DialogDescription>
          </DialogHeader>
          {clientSecret && stripeConfigured && (
            <StripeCheckout clientSecret={clientSecret} onSuccess={done} variant="amber" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
