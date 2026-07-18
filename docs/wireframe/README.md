# Wireframe

**The ODOO wireframe lands here at ~9:33 on July 18 (build day).**

The wireframe arrives tomorrow — **do not invent one.** Building a screen against a guessed layout is wasted work the moment the real IA drops.

## The one rule

Its information architecture sets layout. Where it conflicts with a design hard-ban:

> **Structure wins, styling loses.**

Keep the wireframe's information architecture (what goes where, what nests under what, the navigation model). Replace its styling with `lib/design-tokens.ts`. See `docs/design-standards.md` §8 for the full statement of this rule.

## When it lands

1. Drop the wireframe file(s) into this directory.
2. The integrator reads the IA and maps sections to route groups + `nav.config.ts` entries.
3. Slices A/B/C/D pick up their screens against the real layout.

Until then: this directory holds this note and nothing else.
