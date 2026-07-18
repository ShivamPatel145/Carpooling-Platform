# Analytics & Reporting

**When to use this:** building a stats endpoint, a chart, or a reporting screen. Charts are **recharts**
with a **colorblind-safe palette** (use the `/dataviz` skill). The unbreakable rule from the design law:
**every number must be real and sourced** — no fabricated stat rows.

```
Build the {{feature}} analytics (stats endpoint and/or charts and/or a reporting screen) for
`{{entity}}`. Use the /dataviz skill for chart forms and palette, and follow design-standards.

DATA — real numbers only (design-standards §1):
- Aggregate on the server in a stats endpoint: app/api/<resource>/stats/route.ts. Copy the shape of
  app/api/demo-entity/stats/route.ts — Promise.all of grouped counts + totals, returned via ok().
  Guard it with `requirePermission("{{entity}}", "read")` (or "report","read" for the reporting
  surface — the `report` resource already exists in the statement).
- Do NOT fabricate numbers to fill a chart. A row of large meaningless stats ("25% · 95% · 2025") is a
  hard ban. If the data is genuinely empty, render the EmptyState, not invented figures.
- Read the stats through a TanStack Query hook (see useDemoStats in features/_demo/hooks.ts), with a
  stats query key.

CHARTS (recharts + /dataviz):
- Pick the chart form deliberately per /dataviz (bar for categorical comparison, line for time series,
  etc.) — don't default everything to a bar chart.
- Palette: colorblind-safe, and consistent with the design tokens — the ONE accent as the primary
  series colour, neutrals for the rest. NO purple/violet, NO gradients (fills or strokes). Keep the
  accent as a token; don't hardcode hexes across series.
- Accessibility: every axis labelled, a legend where there's more than one series, a tooltip with the
  real values and units, and enough contrast to pass at a glance. Don't rely on colour alone to
  distinguish series — /dataviz covers the patterns.
- Responsive: the chart reflows at 375 / 768 / 1024 / 1440 and never causes horizontal scroll (wrap in
  ResponsiveContainer).

SCREEN:
- Reporting pages live under the approver+ route group (Reports nav item, minRole "approver"). Use the
  dashboard shell + <PageHeader>. Stat tiles can reuse @/components/dashboard/stat-card.
- The FIVE states apply here too: loading skeleton while stats load, EmptyState when there's no data,
  ErrorState with retry, success toast on export, status badges where relevant.
- If there's an export (CSV/PDF): PDF goes through lib/pdf (see the documentation/PDF pattern); gate
  export with `requirePermission("report", "export")`; log it with logActivity.

WHAT TO CHART / REPORT: {{the metrics, the groupings, the time range, the roles who see it}}

Confirm every figure on the screen traces to a real query result, and run the /dataviz + §9 checks
before calling it done.
```

## Notes — check in the output

- **Numbers come from real queries.** Trace each figure on the screen to a `stats` endpoint result. Any
  hardcoded impressive-looking percentage is the fabricated-stats ban — reject.
- **`/dataviz` was actually applied**: deliberate chart form, colorblind-safe palette, labelled axes,
  legend, real-value tooltips. Not colour-only differentiation.
- **No purple, no gradient fills/strokes.** Accent-as-token for the primary series; neutrals elsewhere.
- **Aggregation is server-side** in `app/api/<resource>/stats/`, guarded with `requirePermission`, read
  via a TanStack Query hook — not computed on the client over a full table pull.
- **Empty data → EmptyState**, not invented numbers. All five states present.
- **Responsive** via `ResponsiveContainer`; no horizontal scroll at 375px.
- Export (if any) is **gated (`report`/`export`), goes through `lib/pdf`, and is logged.**
