import path from "path";
import { Worker } from "worker_threads";
import type { InvoiceData } from "@/lib/pdf/invoice-document";

/**
 * Render the invoice PDF to a Buffer via a WORKER THREAD.
 *
 * ⚠️  Why a worker: @react-pdf/renderer (external, node-resolved React) rejects elements created by
 *     Next's bundled React with "React error #31". The worker (lib/pdf/invoice.worker.cjs) runs
 *     OUTSIDE Next's bundle as plain CommonJS, so react-pdf and React are one instance there. This
 *     is the reliable, Vercel-safe way to render react-pdf from the Next server. The invoice layout
 *     is mirrored in the worker (kept in sync with invoice-document.tsx, which is the typed source).
 */
const WORKER_PATH = path.join(process.cwd(), "lib", "pdf", "invoice.worker.cjs");

export function renderInvoicePdf(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_PATH);
    const cleanup = () => worker.terminate();

    worker.once("message", (msg: { ok: boolean; base64?: string; error?: string }) => {
      cleanup();
      if (msg.ok && msg.base64) resolve(Buffer.from(msg.base64, "base64"));
      else reject(new Error(msg.error ?? "PDF worker failed"));
    });
    worker.once("error", (err) => {
      cleanup();
      reject(err);
    });
    worker.once("exit", (code) => {
      if (code !== 0) reject(new Error(`PDF worker exited with code ${code}`));
    });

    worker.postMessage(data);
  });
}

/** Build a standard PDF download/inline Response from a rendered buffer. */
export function pdfResponse(
  buffer: Buffer,
  filename: string,
  disposition: "inline" | "attachment" = "inline",
): Response {
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
