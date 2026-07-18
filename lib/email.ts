import { Resend } from "resend";
import { render } from "@react-email/components";
import { env, features } from "@/lib/env";
import { logger } from "@/lib/logger";
import { NotificationEmail, type NotificationEmailProps } from "@/emails/notification-email";

/**
 * Email utility on Resend + React Email. Cross-cutting — every slice sends through here, never a
 * per-feature mailer (extensibility contract #4). Degrades gracefully: if RESEND_API_KEY is
 * absent, it logs the email instead of throwing, so Phase 0 and local dev keep working.
 *
 * From address: falls back to Resend's onboarding sender until a verified domain is configured.
 */
const resend = features.email ? new Resend(env.RESEND_API_KEY) : null;

const FROM = "Operations Platform <onboarding@resend.dev>"; // TODO(build-day): verified domain sender

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  /** pre-rendered HTML (use sendNotificationEmail for the generic template) */
  html?: string;
  text?: string;
  react?: React.ReactElement;
}

export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; id?: string }> {
  if (!resend) {
    logger.warn("Email skipped (RESEND_API_KEY not set)", { to: input.to, subject: input.subject });
    return { ok: false };
  }
  try {
    let html = input.html;
    if (!html && input.react) html = await render(input.react);

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: input.subject,
      html: html ?? "",
      text: input.text,
    });
    if (error) {
      logger.error("Resend send failed", { error, subject: input.subject });
      return { ok: false };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    logger.error("sendEmail threw", { err, subject: input.subject });
    return { ok: false };
  }
}

/** Convenience: render + send the generic notification template. */
export async function sendNotificationEmail(
  to: string | string[],
  subject: string,
  props: NotificationEmailProps,
) {
  return sendEmail({ to, subject, react: NotificationEmail(props) });
}
