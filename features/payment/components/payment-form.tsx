"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { SelectField } from "@/components/form";
import { paymentFormSchema, type PaymentFormValues } from "@/features/payment/schema";
import { useCreatePayment } from "@/features/payment/hooks";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

/**
 * QR checkout — a direct UPI transfer to the driver. We render a UPI intent QR (payee VPA + amount);
 * the passenger scans it with any UPI app, pays the driver bank-to-bank, then confirms. On confirm we
 * record a `qr` payment, which settles off-platform (like cash) and completes the trip.
 */
function QrCheckout({
  bookingId,
  fareAmount,
  driverName,
  payeeVpa,
  onBack,
  onSuccess,
}: {
  bookingId: string;
  fareAmount: number;
  driverName?: string | null;
  payeeVpa: string;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const createPayment = useCreatePayment();
  const upiString =
    `upi://pay?pa=${encodeURIComponent(payeeVpa)}` +
    `&pn=${encodeURIComponent(driverName || "Driver")}` +
    `&am=${fareAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent("Carpool ride")}`;

  async function confirmPaid() {
    try {
      await createPayment.mutateAsync({ bookingId, method: "qr" });
    } catch {
      return; // the hook surfaces the error toast
    }
    toast({ variant: "success", title: "Payment recorded", description: "Your ride is settled." });
    onSuccess();
  }

  return (
    <div className="space-y-5 text-center">
      <div>
        <div className="text-[15px] font-semibold text-[color:var(--ink)]">Scan to pay ₹{fareAmount.toFixed(2)}</div>
        <p className="mx-auto mt-1 max-w-xs text-[13px] text-[color:var(--ink-3)]">
          Open any UPI app (GPay, PhonePe, Paytm) and scan to pay {driverName || "your driver"} directly.
        </p>
      </div>
      <div className="mx-auto w-fit rounded-2xl border border-[color:var(--line)] bg-white p-4">
        <QRCode value={upiString} size={196} />
      </div>
      <div className="font-mono text-[12px] text-[color:var(--ink-3)]">{payeeVpa}</div>
      <div className="space-y-2 pt-1">
        <Button onClick={confirmPaid} disabled={createPayment.isPending} className="w-full">
          {createPayment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          I&apos;ve completed the payment
        </Button>
        <Button type="button" variant="ghost" onClick={onBack} disabled={createPayment.isPending} className="w-full">
          <ArrowLeft className="mr-2 h-4 w-4" /> Choose another method
        </Button>
      </div>
    </div>
  );
}

/**
 * Post-ride settlement. QR (scan a UPI code) and Cash both settle off-platform; Wallet spends the
 * passenger's in-app balance. All three complete the trip server-side with no redirect — the
 * passenger never leaves the page.
 */
export function PaymentForm({
  bookingId,
  fareAmount,
  driverName,
  payeeVpa,
}: {
  bookingId: string;
  fareAmount: number;
  driverName?: string | null;
  payeeVpa: string;
}) {
  const router = useRouter();
  const createPayment = useCreatePayment();
  const [showQr, setShowQr] = React.useState(false);
  const qc = useQueryClient();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: { bookingId, method: "qr" },
  });

  function finish() {
    qc.invalidateQueries({ queryKey: ["trip"] });
    router.push("/history");
  }

  async function onSubmit(values: PaymentFormValues) {
    // QR is a two-step method: show the code first, record the payment only once the user confirms.
    if (values.method === "qr") {
      setShowQr(true);
      return;
    }
    // Wallet + cash settle server-side immediately (no redirect).
    try {
      await createPayment.mutateAsync(values);
    } catch {
      return; // the hook surfaces the error toast (e.g. insufficient wallet balance)
    }
    toast({ variant: "success", title: "Payment complete", description: "Your trip is paid for." });
    finish();
  }

  if (showQr) {
    return (
      <QrCheckout
        bookingId={bookingId}
        fareAmount={fareAmount}
        driverName={driverName}
        payeeVpa={payeeVpa}
        onBack={() => setShowQr(false)}
        onSuccess={finish}
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
            { label: "Scan QR Code (UPI)", value: "qr" },
            { label: "Cash", value: "cash" },
            { label: "Wallet Balance", value: "wallet" },
          ]}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={createPayment.isPending} className="w-full">
            {createPayment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </Button>
        </div>
      </form>
    </Form>
  );
}
