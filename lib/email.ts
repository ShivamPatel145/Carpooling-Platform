import nodemailer from "nodemailer";
import { render } from "@react-email/components";
import { env, features } from "@/lib/env";
import { logger } from "@/lib/logger";
import { NotificationEmail, type NotificationEmailProps } from "@/emails/notification-email";

/**
 * Email utility using Nodemailer + React Email. Cross-cutting — every slice sends through here, never a
 * per-feature mailer (extensibility contract #4). Degrades gracefully: if EMAIL_USER is
 * absent, it logs the email instead of throwing, so Phase 0 and local dev keep working.
 */
const transporter = features.email
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
    })
  : null;

const FROM = `"Carpooling Platform" <${env.EMAIL_USER || "onboarding@resend.dev"}>`;

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  /** pre-rendered HTML (use sendNotificationEmail for the generic template) */
  html?: string;
  text?: string;
  react?: React.ReactElement;
}

export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; id?: string }> {
  if (!transporter) {
    logger.warn("Email skipped (EMAIL_USER not set)", { to: input.to, subject: input.subject });
    return { ok: false };
  }
  try {
    let html = input.html;
    if (!html && input.react) html = await render(input.react);

    const info = await transporter.sendMail({
      from: FROM,
      to: Array.isArray(input.to) ? input.to.join(", ") : input.to,
      subject: input.subject,
      html: html ?? "",
      text: input.text,
    });
    
    logger.info("Email sent", { to: input.to, subject: input.subject, id: info.messageId });
    return { ok: true, id: info.messageId };
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
