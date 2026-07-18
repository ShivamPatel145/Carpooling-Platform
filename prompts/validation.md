# Validation

**When to use this:** writing or fixing the Zod schema for an entity. The cardinal rule of this repo
is **one schema, two consumers** — the API route and the form import the *same* object. Two copies
drift, and the drift shows up as validation passing on the client and failing on the server at hour 14.

```
Write / fix the Zod validation for `{{entity}}`. There is exactly ONE schema and it is shared by
BOTH the API route and the form. Model it on db/schema/demo-entity.ts (bottom section) and
features/_demo/schema.ts.

WHERE IT LIVES:
- The real schema is colocated in db/schema/{{entity}}.ts, derived from the Drizzle table so the
  table, the types, and the validation can't drift.
- features/{{entity}}/schema.ts RE-EXPORTS it (it does not define a second copy) and adds
  UI-only helpers like the enum→options list for selects/faceted filters. Copy the shape of
  features/_demo/schema.ts.

THE THREE SCHEMAS (same names as demo-entity.ts):
- `{{entity}}SelectSchema` = createSelectSchema(table)  — the read shape.
- `{{entity}}FormSchema`   = a hand-written z.object — the WRITE shape the form and the API both
  parse. This is the important one. Types via z.infer → `{{entity}}FormValues`.
- `{{entity}}InsertSchema` = createInsertSchema(table).omit({ id, createdAt, updatedAt }) — the
  server insert shape (owner is supplied by the route from the session, not the client).

WRITE-SCHEMA RULES (match demo-entity.ts conventions):
- Human-readable messages on every constraint: `.min(2, "Name must be at least 2 characters")`.
  These render directly under the field, so write them for a user, not a developer.
- Numbers from form inputs come in as strings → use `z.coerce.number()` (and `.int(...)` where
  whole-number). Dates → `z.coerce.date()`.
- Optional text fields that the form sends as "" → `.optional().or(z.literal(""))`, and the route
  converts "" → null on insert (see route.ts: `values.description || null`).
- Enums → `z.enum({{entity}}StatusEnum.enumValues)` so the enum has ONE source (the pgEnum).
- URLs (UploadThing attachments) → `.url("Must be a valid URL").optional().or(z.literal(""))`.

CONSUMERS — verify both import from the shared schema:
- The form: `useForm({ resolver: zodResolver({{entity}}FormSchema) })` (see features/_demo/form.tsx).
- The API route: `{{entity}}FormSchema.parse(await req.json())` as the second line, after
  requirePermission (see app/api/demo-entity/route.ts). A thrown ZodError is turned into a 400 with
  field issues automatically by withErrorHandler in lib/api.ts — I do not catch it myself.

FIELDS + CONSTRAINTS: {{list each field and its rule — min/max, required/optional, enum values,
number range, etc.}}

Do NOT write a second validation object anywhere, and do NOT validate again inside the route beyond
the single .parse(). One parse, shared schema.
```

## Notes — check in the output

- **No second copy.** Search the diff: the form and the route must both reference
  `{{entity}}FormSchema`, imported from `features/{{entity}}/schema.ts`. If you see two `z.object`
  blocks describing the same entity, that's the exact bug this rule exists to prevent.
- **`features/{{entity}}/schema.ts` re-exports**, it doesn't redefine. It's allowed to add the
  `enumValues.map(...)` options helper (that's what `_demo` does).
- **`z.coerce`** on numbers and dates — form fields are strings. A bare `z.number()` will reject valid
  form input.
- **Messages are user-facing sentences.** They surface under the input. "Invalid" is not one.
- **The route doesn't re-catch ZodError.** `withErrorHandler` maps it to a 400 with `issues`. A manual
  try/catch around the parse is redundant and usually swallows the field details.
