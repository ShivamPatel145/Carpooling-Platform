import type { Metadata } from "next";
import { requireRolePage } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { PaymentForm } from "@/features/payment/components/payment-form";
import { db } from "@/db";
import { booking } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Pay for Trip" };

export default async function PayPage({ params }: { params: { bookingId: string } }) {
  await requireRolePage("employee");

  const [b] = await db.select().from(booking).where(eq(booking.id, params.bookingId)).limit(1);
  if (!b) notFound();

  return (
    <div className="max-w-md mx-auto space-y-6 mt-10">
      <PageHeader
        title="Complete Payment"
        description="Choose a payment method to settle your ride."
      />
      <Card>
        <CardContent className="pt-6">
          <PaymentForm bookingId={b.id} fareAmount={Number(b.fareAmount)} />
        </CardContent>
      </Card>
    </div>
  );
}
