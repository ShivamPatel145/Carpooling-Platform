import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

/**
 * GENERIC notification email — the ONE template ready to duplicate (Block 7). Domain emails copy
 * this and change the copy/CTA. Styling is inline (email clients ignore <style>/external CSS) and
 * mirrors the neutral+accent design language without depending on Tailwind.
 *
 * Preview locally: `pnpm email` (react-email dev server) — see package.json note.
 */
export interface NotificationEmailProps {
  recipientName?: string;
  heading: string;
  body: string;
  /** optional call-to-action */
  ctaLabel?: string;
  ctaUrl?: string;
  productName?: string;
}

// Dusk Route signal amber. Button uses the amber-600 fill with dark-ink text (5.59:1, AA) —
// white text on amber fails contrast, so the on-accent colour is the ink, per lib/design-tokens.ts.
const ACCENT = "#C9820E"; // amber-600 fill
const ON_ACCENT = "#231703"; // ink text on the amber fill

export function NotificationEmail({
  recipientName,
  heading,
  body,
  ctaLabel,
  ctaUrl,
  productName = "Coride",
}: NotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{heading}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.brandRow}>
            <Text style={styles.brand}>{productName}</Text>
          </Section>
          <Section style={styles.card}>
            <Heading style={styles.heading}>{heading}</Heading>
            {recipientName && <Text style={styles.greeting}>Hi {recipientName},</Text>}
            <Text style={styles.paragraph}>{body}</Text>
            {ctaLabel && ctaUrl && (
              <Section style={styles.ctaRow}>
                <Button href={ctaUrl} style={styles.button}>
                  {ctaLabel}
                </Button>
              </Section>
            )}
            <Hr style={styles.hr} />
            <Text style={styles.footer}>
              You're receiving this because you have an account with {productName}.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default NotificationEmail;

const styles = {
  body: { backgroundColor: "#f5f5f5", fontFamily: "'IBM Plex Sans', Helvetica, Arial, sans-serif", margin: 0, padding: "24px 0" },
  container: { maxWidth: "560px", margin: "0 auto", padding: "0 16px" },
  brandRow: { padding: "8px 0 16px" },
  brand: { fontSize: "16px", fontWeight: 600, color: "#0a0a0a", margin: 0 },
  card: { backgroundColor: "#ffffff", border: "1px solid #e5e5e5", borderRadius: "8px", padding: "32px" },
  heading: { fontSize: "20px", fontWeight: 600, color: "#0a0a0a", margin: "0 0 16px" },
  greeting: { fontSize: "14px", color: "#0a0a0a", margin: "0 0 8px" },
  paragraph: { fontSize: "14px", lineHeight: "1.6", color: "#404040", margin: "0 0 16px" },
  ctaRow: { padding: "8px 0 4px" },
  button: {
    backgroundColor: ACCENT,
    color: ON_ACCENT,
    fontSize: "14px",
    fontWeight: 600,
    textDecoration: "none",
    padding: "10px 20px",
    borderRadius: "6px",
    display: "inline-block",
  },
  hr: { borderColor: "#e5e5e5", margin: "24px 0 16px" },
  footer: { fontSize: "12px", color: "#737373", margin: 0 },
} as const;
