"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CreditCard } from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { TextField, SelectField } from "@/components/form";
import { rechargeFormSchema, type RechargeFormValues } from "@/features/wallet/schema";
import { useRechargeWallet } from "@/features/wallet/hooks";
import { useQueryClient } from "@tanstack/react-query";

// The `@stripe/*` React tree is loaded lazily (client-only), reached only after a clientSecret
// exists, so /wallet no longer eagerly compiles/bundles Stripe on first visit.
const StripeCheckout = dynamic(
  () => import("./stripe-checkout").then((m) => m.StripeCheckout),
  { ssr: false, loading: () => <Loader2 className="mx-auto h-5 w-5 animate-spin" /> },
);

export function RechargeDialog() {
  const [open, setOpen] = React.useState(false);
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const initiate = useRechargeWallet();
  const qc = useQueryClient();

  const form = useForm<RechargeFormValues>({
    resolver: zodResolver(rechargeFormSchema),
    defaultValues: { amount: 500, method: "card" },
  });

  async function onSubmit(values: RechargeFormValues) {
    const res = await initiate.mutateAsync(values);
    if (res?.clientSecret) setClientSecret(res.clientSecret);
  }

  function handleSuccess() {
    setOpen(false);
    setClientSecret(null);
    form.reset();
    qc.invalidateQueries({ queryKey: ["wallet"] });
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) setClientSecret(null);
    }}>
      <DialogTrigger asChild>
        <Button>
          <CreditCard className="mr-2 h-4 w-4" />
          Recharge Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Recharge Wallet</DialogTitle>
          <DialogDescription>Add funds to your wallet to pay for rides effortlessly.</DialogDescription>
        </DialogHeader>

        {!clientSecret ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <TextField control={form.control} name="amount" label="Amount (₹)" type="number" />
              <SelectField
                control={form.control}
                name="method"
                label="Payment Method"
                options={[
                  { label: "Card", value: "card" },
                  { label: "UPI", value: "upi" },
                ]}
              />
              <div className="flex justify-end gap-2">
                <Button type="submit" disabled={initiate.isPending}>
                  {initiate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Proceed to Pay
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <StripeCheckout clientSecret={clientSecret} onSuccess={handleSuccess} />
        )}
      </DialogContent>
    </Dialog>
  );
}
