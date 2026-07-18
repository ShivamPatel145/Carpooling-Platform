/**
 * HOMEPAGE SECTIONS — a CONFIG ARRAY (extensibility contract #2). The public homepage renders
 * these sections in order. Adding/reordering a section is a DATA change; each section's component
 * is wired by `key` in the homepage. This keeps the homepage from becoming a monolith to rewrite
 * at hour 18.
 *
 * ⚠️  SHARED FILE — integrator only.
 *
 * BUILD-DAY: the hero copy and section content become domain-specific. Per design-standards §0/§9:
 * the hero opens with the most characteristic thing about the domain — NOT a centered slogan +
 * two buttons + a stat row. Real composition.
 */
export interface HomepageSection {
  key: string;
  enabled: boolean;
}

export const homepageConfig: HomepageSection[] = [
  { key: "hero", enabled: true },
  { key: "capabilities", enabled: true },
  { key: "roles", enabled: true },
  { key: "cta", enabled: true },
  // BUILD-DAY: domain-specific sections (workflow explainer, metrics-that-are-real, etc.)
];

/** Placeholder marketing copy — REPLACED on build day with real, domain-specific words. */
export const homepageCopy = {
  productName: "Coride",
  tagline: "Ride Together, Save Together.",
  subhead:
    "Coride matches you with verified colleagues on your exact commute — so the daily drive costs less, pollutes less, and finally feels like time worth having.",
} as const;
