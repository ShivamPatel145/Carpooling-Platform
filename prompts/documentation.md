# Documentation

**When to use this:** keeping the living docs current as slices land — `docs/api.md`, `docs/database.md`,
`docs/decisions.md`, the requirement trace table, and diagrams. This is ongoing from hour 1, not a
hour-20 scramble. (For the reviewer cheat-sheet specifically, use `reviewer-preparation.md`.)

```
Update the project docs for {{feature}} / `{{entity}}`. These are maintained AS the build happens —
keep them terse, factual, and current. Do not write marketing prose or restate what the code already
says clearly.

docs/database.md — add/refresh the {{entity}} section:
  - The table, its columns (name · type · nullable · default), its enum(s), and its indexes (and why
    each non-obvious index exists — the FK, the filtered/sorted columns).
  - Its relations and its ownership column.
  - Keep it a reference a teammate reads to understand the schema without opening the file.

docs/api.md — add/refresh the <resource> section:
  - Each endpoint: METHOD path → purpose, the required permission (resource:action), the request body
    (point at the shared Zod schema — don't restate every field), the success shape, and the error
    codes it can return (401/403/404/400/409 via the typed errors).
  - Note the RBAC negative case (which role gets 403 where).

docs/decisions.md — if a real architecture/trade-off decision was made building this, add one entry:
  the decision, the alternative rejected, and the one-line reason. (This feeds reviewer prep.)

docs/overview.md trace table — every requirement maps to exactly ONE slice. Add {{feature}}'s
requirement(s) so nothing is silently dropped at hour 20.

DIAGRAMS (high value around hour 20, cheap to keep current now):
  - ERD or architecture diagram: use the Diagram project type (project-type-picker). Keep it derived
    from the actual schema/routes, not idealized.

CONSTRAINTS:
  - Facts live in docs; PROCEDURES live in .claude/skills/ — don't duplicate a skill's steps into a doc.
  - Do NOT create new .md files unless one is genuinely missing; extend the existing docs.
  - docs/reviewer-prep.md is a DIFFERENT thing (gitignored cheat sheet) — see the reviewer-preparation
    prompt; don't fold it in here.

WHAT LANDED: {{the entity/endpoints/decision to document}}
```

## Notes — check in the output

- **Right files.** Schema facts in `docs/database.md`, endpoints in `docs/api.md`, decisions in
  `docs/decisions.md`, requirement in the `docs/overview.md` trace table. It should extend these, not
  spawn new markdown files.
- **API doc names the permission and error codes** per endpoint, and points at the shared Zod schema
  rather than re-listing fields (which would drift).
- **DB doc explains the non-obvious indexes** — that's the reviewer's performance question answered in
  advance.
- **No procedures copied from skills.** Docs hold facts; skills hold the how-to.
- **`docs/reviewer-prep.md` was not touched here** — that's the separate gitignored cheat sheet.
- **The trace table has the new requirement**, mapped to one slice.
