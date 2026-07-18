import { eq } from "drizzle-orm";
import { db } from "@/db";
import { demoEntity } from "@/db/schema";
import { requirePermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { NotFoundError } from "@/lib/errors";
import { withErrorHandler } from "@/lib/api";
import { renderInvoicePdf, pdfResponse } from "@/lib/pdf/render";
import { formatDate, shortId } from "@/lib/utils";

// @react-pdf/renderer needs the Node runtime (it's serverExternalPackages in next.config).
export const runtime = "nodejs";

/**
 * GET /api/demo-entity/:id/invoice — render a placeholder invoice PDF for one item. Proves the
 * PDF pipeline against REAL data. Copy this route for the domain's printable artifact.
 */
export const GET = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requirePermission("report", "export");
  const { id } = await params;

  const row = await db.query.demoEntity.findFirst({ where: eq(demoEntity.id, id) });
  if (!row) throw new NotFoundError("That item doesn't exist.");

  const buffer = await renderInvoicePdf({
    number: shortId(row.id).toUpperCase(),
    issuedAt: formatDate(row.createdAt),
    dueAt: row.dueDate ? formatDate(row.dueDate) : undefined,
    from: { name: "Operations Platform" },
    billTo: { name: row.name },
    items: [{ description: row.name, quantity: 1, unitPrice: row.amount }],
    notes: row.description ?? "Placeholder invoice generated from a demo entity.",
  });

  await logActivity({ actorId: undefined, action: "export", resource: "report", resourceId: id, req });

  return pdfResponse(buffer, `invoice-${shortId(row.id)}.pdf`);
});
