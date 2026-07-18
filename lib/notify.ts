import { db } from "@/db";
import { notification } from "@/db/schema";
import type { NotificationType } from "@/db/schema/notification";
import { sendNotificationEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * notifyUser — the cross-cutting notification helper (PRD §7.15). Inserts an in-app `notification`
 * row AND (best-effort) sends the generic email template. Slice B wires the trip triggers; every
 * slice reuses this rather than building a parallel notifier. Never throws into the request path —
 * a notification is a side effect, not the action.
 */
export interface NotifyInput {
  userId: string;
  title: string;
  body?: string;
  type?: NotificationType;
  href?: string;
  resource?: string;
  resourceId?: string;
  /** recipient email — omit to skip the email (in-app only). Email also self-skips without Resend. */
  toEmail?: string | null;
  recipientName?: string | null;
}

export async function notifyUser(input: NotifyInput): Promise<void> {
  try {
    await db.insert(notification).values({
      userId: input.userId,
      type: input.type ?? "info",
      title: input.title,
      body: input.body ?? null,
      href: input.href ?? null,
      resource: input.resource ?? null,
      resourceId: input.resourceId ?? null,
    });
  } catch (err) {
    logger.error("notifyUser: in-app insert failed", { err, userId: input.userId, title: input.title });
  }

  if (input.toEmail) {
    // sendNotificationEmail already degrades to a log when RESEND_API_KEY is absent (local dev).
    await sendNotificationEmail(input.toEmail, input.title, {
      recipientName: input.recipientName ?? undefined,
      heading: input.title,
      body: input.body ?? input.title,
      ctaLabel: input.href ? "Open in the app" : undefined,
      ctaUrl: input.href ? `${env.NEXT_PUBLIC_APP_URL}${input.href}` : undefined,
      productName: "Enterprise Carpooling",
    });
  }
}
