---
name: design-standards
description: This project's visual design law, derived from CLAUDEwebdesign.md. Use whenever writing, generating, restyling, or reviewing ANY UI code, page, component, style, animation, layout, or Claude Design output. Every screen, every time — including "quick" internal pages, admin screens, and anything a reviewer might not see. Also use when checking whether a design looks AI-generated.
paths: app/**, components/**, features/**, lib/design-tokens.ts, tailwind.config.ts
---

# Design Standards

**Read `docs/design-standards.md` in full before the first UI task of any session.** It is the complete text and it overrides your taste. This skill is the enforcement summary, not a replacement.

## The rule that matters most

If a stranger could glance at the page for two seconds and say "an AI made this," the screen has failed — regardless of whether the code works. Distinctiveness and restraint are the job, not a bonus.

## Our register: professional, and that is not the same as generic

The product must read as a real SaaS/ERP tool to a reviewer who builds software for a living: clean, minimal, dashboard-first, business-focused (master prompt §7). This sits in apparent tension with the rule above, and §5 resolves it: **minimal directions need precise spacing and detail.** Restraint executed precisely. Distinctiveness comes from precision, not decoration — a defaulted minimal page and a considered minimal page look nothing alike to the person judging this. "It's supposed to be professional" is not a defence for a defaulted screen.

## Hard bans — reject on sight, in generation AND review

- Purple/violet/indigo as primary (`#7c3aed`, `#8b5cf6`, `#a855f7`, `#6366f1` and neighbours). The single biggest tell.
- Purple↔blue or purple↔pink gradients, anywhere — background, button, or text
- Gradient-filled headline words
- Rows of large meaningless stats ("25% · 95% · 2025"). A number ships only if it's real and sourced.
- Emoji in headings or section titles
- "Why Choose Us", "Transform your X into Y", and interchangeable SaaS slogans
- Glassmorphism by default — frosted cards, heavy blur, soft glow
- Pill-badge clutter under the hero
- Everything centered in one column, top to bottom
- Raw Inter/system-ui as the entire type system
- Soft drop shadows on every card. Shadow is an accent, not a texture.

These are not preferences. They are the fingerprints of generated work, and this competition is judged partly on whether the product reads as a real tool.

## Project-specific rules

1. **The ODOO wireframe (`docs/wireframe/`) sets layout.** Where it conflicts with a hard ban: **structure wins, styling loses.** Keep its information architecture; replace its styling.
2. **The token system is `lib/design-tokens.ts`.** The neutral base and type system were locked in Phase 0 and are synced + published to Claude Design. Only the **accent** changes — one domain-derived colour, one line. Don't redesign what's already synced; you'll desynchronise the design system and burn the window re-syncing.
3. **Type — locked, don't relitigate:** Space Grotesk (display) · IBM Plex Sans (body) · IBM Plex Mono (tabular data, IDs, numerals in the DataTable). Explicit scale, body line-height 1.5–1.7, headlines tighter leading and tracking, `font-display: swap`, real fallbacks, tabular numerals on the mono face. Reverting to Inter/system-ui is a §1 violation, not a simplification.
4. **Colour:** confident neutral base + ONE disciplined accent, used sparingly. WCAG AA — 4.5:1 body, 3:1 large text. Want energy? Get it from composition and type, not gradients.
5. **Motion (Framer Motion):** one orchestrated page-load reveal plus subtle hover micro-interactions. One considered moment beats scattered effects — excess animation is itself an AI tell. `prefers-reduced-motion` always respected.
6. **Responsive:** mobile-first, verified at 375 / 768 / 1024 / 1440. Tap targets ≥44×44px. No horizontal scroll. The mobile menu actually works.
7. **Quality floor, built in silently:** visible keyboard focus states, semantic HTML, alt text, labelled form controls. Watch CSS specificity — verify spacing actually applies rather than assuming it did.

## Claude Design output is not exempt

If a generated design lands on a documented default aesthetic — cream-and-terracotta warmth, near-black with one neon accent, or hairline-rule broadsheet — that's the tool's default, not a decision. Push back before it becomes the product's visual identity.

## Before marking ANY screen done

Run the vibe-code checklist in `docs/design-standards.md` §9. **Every item must be NO.** Then apply Chanel's rule: remove one thing that isn't earning its place.
