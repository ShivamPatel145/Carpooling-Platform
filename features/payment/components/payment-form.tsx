"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { SelectField } from "@/components/form";
import { paymentFormSchema, type PaymentFormValues } from "@/features/payment/schema";
import { useCreatePayment } from "@/features/payment/hooks";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: () => void; }) {
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
      <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
        <CheckoutForm clientSecret={clientSecret} onSuccess={() => {
          qc.invalidateQueries({ queryKey: ["trip"] });
          router.push("/history");
        }} />
      </Elements>
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
