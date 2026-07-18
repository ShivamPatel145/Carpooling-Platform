import { createElement as h } from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

/**
 * PLACEHOLDER invoice PDF (@react-pdf/renderer — pure JS, Vercel-safe, no headless browser).
 * Invoice/report generation is a near-universal requirement; this proves the pipeline end to end.
 * Build-day: copy this, keep the pipeline (lib/pdf/render.ts + the route), swap the fields.
 *
 * ⚠️  Built with React.createElement (`h`), NOT JSX, on purpose. Under Next's server bundle, JSX
 *     goes through Next's `react/jsx-runtime`, whose elements react-pdf's separate reconciler
 *     rejects as foreign objects ("React error #31"). Creating elements via the `react` module that
 *     react-pdf itself resolves keeps ONE React instance and renders cleanly. Keep this file JSX-free.
 *
 * Uses Helvetica (a built-in @react-pdf font) so it renders with zero font registration.
 */
export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceData {
  number: string;
  issuedAt: string;
  dueAt?: string;
  billTo: { name: string; email?: string };
  from: { name: string };
  items: InvoiceLineItem[];
  currency?: string;
  notes?: string;
}

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#0a0a0a" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold" },
  muted: { color: "#737373" },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  metaBlock: { maxWidth: 240 },
  label: { fontSize: 8, color: "#737373", textTransform: "uppercase", marginBottom: 2, letterSpacing: 1 },
  value: { fontSize: 10, marginBottom: 6 },
  table: { borderTop: "1 solid #e5e5e5", marginTop: 8 },
  tr: { flexDirection: "row", borderBottom: "1 solid #e5e5e5", paddingVertical: 6 },
  thRow: { flexDirection: "row", borderBottom: "1 solid #0a0a0a", paddingBottom: 6 },
  cDesc: { flex: 4 },
  cQty: { flex: 1, textAlign: "right" },
  cUnit: { flex: 1.5, textAlign: "right" },
  cAmt: { flex: 1.5, textAlign: "right" },
  th: { fontSize: 8, color: "#737373", textTransform: "uppercase", letterSpacing: 1 },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  totalLabel: { width: 100, textAlign: "right", color: "#737373" },
  totalValue: { width: 90, textAlign: "right", fontFamily: "Helvetica-Bold" },
  footer: { position: "absolute", bottom: 32, left: 40, right: 40, fontSize: 8, color: "#737373", borderTop: "1 solid #e5e5e5", paddingTop: 8 },
});

function money(n: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

/** Build the invoice document element. Called by lib/pdf/render.ts (dynamically, single React). */
export function buildInvoiceElement(data: InvoiceData) {
  const currency = data.currency ?? "USD";
  const total = data.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  return h(
    Document,
    { title: `Invoice ${data.number}` },
    h(
      Page,
      { size: "A4", style: styles.page },
      // header
      h(
        View,
        { style: styles.headerRow },
        h(
          View,
          null,
          h(Text, { style: styles.title }, "Invoice"),
          h(Text, { style: styles.muted }, `#${data.number}`),
        ),
        h(
          View,
          { style: { textAlign: "right" } },
          h(Text, { style: { fontFamily: "Helvetica-Bold" } }, data.from.name),
        ),
      ),
      // meta
      h(
        View,
        { style: styles.metaRow },
        h(
          View,
          { style: styles.metaBlock },
          h(Text, { style: styles.label }, "Bill to"),
          h(Text, { style: styles.value }, data.billTo.name),
          data.billTo.email ? h(Text, { style: styles.muted }, data.billTo.email) : null,
        ),
        h(
          View,
          { style: styles.metaBlock },
          h(Text, { style: styles.label }, "Issued"),
          h(Text, { style: styles.value }, data.issuedAt),
          data.dueAt ? h(Text, { style: styles.label }, "Due") : null,
          data.dueAt ? h(Text, { style: styles.value }, data.dueAt) : null,
        ),
      ),
      // table
      h(
        View,
        { style: styles.table },
        h(
          View,
          { style: styles.thRow },
          h(Text, { style: [styles.th, styles.cDesc] }, "Description"),
          h(Text, { style: [styles.th, styles.cQty] }, "Qty"),
          h(Text, { style: [styles.th, styles.cUnit] }, "Unit"),
          h(Text, { style: [styles.th, styles.cAmt] }, "Amount"),
        ),
        ...data.items.map((item, i) =>
          h(
            View,
            { style: styles.tr, key: i },
            h(Text, { style: styles.cDesc }, item.description),
            h(Text, { style: styles.cQty }, String(item.quantity)),
            h(Text, { style: styles.cUnit }, money(item.unitPrice, currency)),
            h(Text, { style: styles.cAmt }, money(item.quantity * item.unitPrice, currency)),
          ),
        ),
      ),
      // total
      h(
        View,
        { style: styles.totalRow },
        h(Text, { style: styles.totalLabel }, "Total"),
        h(Text, { style: styles.totalValue }, money(total, currency)),
      ),
      // notes
      data.notes
        ? h(
            View,
            { style: { marginTop: 24 } },
            h(Text, { style: styles.label }, "Notes"),
            h(Text, { style: styles.muted }, data.notes),
          )
        : null,
      // footer
      h(
        Text,
        { style: styles.footer, fixed: true },
        `${data.from.name} · Generated by the platform · This is a placeholder invoice template.`,
      ),
    ),
  );
}
