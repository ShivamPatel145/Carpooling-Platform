import { eq } from "drizzle-orm";
import { db } from "@/db";
import { trip, ride, booking, organization, payment } from "@/db/schema";
import { requirePermission } from "@/lib/permissions";
import { pdfResponse, renderInvoicePdf } from "@/lib/pdf/render";
import type { InvoiceData } from "@/lib/pdf/invoice-document";

/**
 * GET /api/report/receipt/[tripId]
 * Generates a PDF receipt for a trip.
 */
export async function GET(req: Request, { params }: { params: { tripId: string } }) {
  const { session, tenant } = await requirePermission("trip", "read");
  const { tripId } = params;

  // Fetch trip
  const [t] = await db.select().from(trip).where(eq(trip.id, tripId)).limit(1);
  if (!t) return new Response("Trip not found", { status: 404 });

  // Fetch ride
  const [r] = await db.select().from(ride).where(eq(ride.id, t.rideId)).limit(1);

  // Fetch booking for the passenger if current user is passenger
  const [b] = await db.select().from(booking).where(eq(booking.rideId, t.rideId)).limit(1);

  // Fetch org
  const [org] = await db.select().from(organization).where(eq(organization.id, tenant.orgId!)).limit(1);

  const data: InvoiceData = {
    number: t.id.split("-")[0].toUpperCase(),
    issuedAt: t.completedAt ? new Date(t.completedAt).toLocaleDateString() : new Date().toLocaleDateString(),
    billTo: {
      name: session.user.name ?? "Passenger",
      email: session.user.email,
    },
    from: {
      name: org?.name ?? "Carpooling Platform",
    },
    currency: "INR",
    items: [
      {
        description: `Ride from ${r?.origin?.label} to ${r?.destination?.label}`,
        quantity: 1,
        unitPrice: Number(b?.fareAmount || 0),
      }
    ],
    notes: "Thank you for riding with us!",
  };

  try {
    const buffer = await renderInvoicePdf(data);
    return pdfResponse(buffer, `receipt-${data.number}.pdf`);
  } catch (err: any) {
    console.error("PDF generation error:", err);
    return new Response(err.message, { status: 500 });
  }
}
