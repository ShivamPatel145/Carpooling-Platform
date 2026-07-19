"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { SelectField } from "@/components/form";
import { paymentFormSchema, type PaymentFormValues } from "@/features/payment/schema";
import { useCreatePayment } from "@/features/payment/hooks";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

// The `@stripe/*` React tree is loaded lazily (client-only) and only reached once a clientSecret
// exists, so /pay/* no longer eagerly compiles/bundles Stripe on first visit.
const StripeCheckout = dynamic(
  () => import("./stripe-checkout").then((m) => m.StripeCheckout),
  { ssr: false, loading: () => <Loader2 className="mx-auto h-5 w-5 animate-spin" /> },
);

export function PaymentForm({ bookingId, fareAmount }: { bookingId: string; fareAmount: number }) {
  const router = useRouter();
  const createPayment = useCreatePayment();
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const qc = useQueryClient();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: { bookingId, method: "wallet" },
  });

  async function onSubmit(values: PaymentFormValues) {
    const res = await createPayment.mutateAsync(values);
    if (res?.clientSecret) {
      setClientSecret(res.clientSecret);
    } else {
      toast({ variant: "success", title: "Payment complete", description: "Your trip is paid for." });
      qc.invalidateQueries({ queryKey: ["trip"] });
      router.push("/history");
    }
  }

  if (clientSecret) {
    return (
      <StripeCheckout
        clientSecret={clientSecret}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ["trip"] });
          router.push("/history");
        }}
      />
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="text-2xl font-bold mb-6 text-center">Amount Due: ₹{fareAmount.toFixed(2)}</div>
        <SelectField
          control={form.control}
          name="method"
          label="Payment Method"
          options={[
            { label: "Wallet Balance", value: "wallet" },
            { label: "Card (Stripe)", value: "card" },
            { label: "UPI", value: "upi" },
            { label: "Cash", value: "cash" },
          ]}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={createPayment.isPending} className="w-full">
            {createPayment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Pay Now
          </Button>
        </div>
      </form>
    </Form>
  );
}
