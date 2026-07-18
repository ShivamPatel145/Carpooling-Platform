# Notifications

**When to use this:** notifying a user — in-app, by email, or both. There is **one** notification
system: the generic `notification` table plus `lib/email.ts` (Resend + React Email). Never build a
per-feature notification path — "a second parallel notification system is a reviewer's favourite thing
to find."

```
Wire notifications for {{feature}} on `{{entity}}`. Use the GENERIC system only — never a
`{{entity}}Notification` table or a per-feature mailer.

IN-APP — insert into the existing `notification` table (db/schema/notification.ts) by reference:
- Fields: userId (recipient), type ("info" | "success" | "warning" | "error"), title, body (optional),
  href (deep link into the app, e.g. /<role>/<resource>/<id>), and resource + resourceId pointing at
  the {{entity}} row it's about. isRead/readAt are managed by the read flow.
- Do this inside the same route/action that performs the triggering mutation, AFTER the write succeeds
  and AFTER logActivity. Notify the right user (the owner, the approver, whoever the workflow targets),
  not the actor by default.
- The bell + unread list already exist (@/components/shell/notifications-bell, the notification API,
  the notification:read/update permissions). You are producing rows, not building UI.

EMAIL — through lib/email.ts (Resend), never a new mailer:
- Use `sendNotificationEmail(to, subject, props)` for the generic React Email template
  (emails/notification-email.tsx), or `sendEmail({ to, subject, react })` for a custom one that still
  goes through this utility.
- It degrades gracefully: with no RESEND_API_KEY it logs instead of throwing, and it never throws into
  the request path — an email failure must not fail the user's action. Don't add try/catch that turns
  a send failure into a 500.
- Send email for events that warrant leaving the app (an approval needed, a decision made) — not for
  every trivial in-app ping. If both channels apply, insert the notification row AND send the email.

DON'T:
- Don't create a new table, enum, or route for this — extend `notification` by reference.
- Don't block or fail the mutation if the notification/email fails.
- Don't put secrets or full record bodies in the email; link back with the href instead.

TRIGGER + RECIPIENTS: {{which event fires it, who receives it (role/owner/approver), which channel(s),
and what the message says in real words}}

Confirm: no new notification table/mailer was introduced, and the trigger fires from inside the
existing mutation after the write + logActivity.
```

## Notes — check in the output

- **No new table or mailer.** The diff inserts into the existing `notification` table and sends via
  `lib/email.ts` (`sendNotificationEmail`/`sendEmail`). A `{{entity}}Notification` table or a fresh
  Resend client is the anti-pattern — reject.
- **Reference, not duplication.** The notification row carries `resource` + `resourceId` + `href` back to
  the `{{entity}}` — it doesn't copy the record.
- **Fires after the write and `logActivity`**, from inside the triggering mutation. The right recipient
  is targeted (owner/approver), not the actor by reflex.
- **Failure is non-fatal.** No try/catch that turns a failed send into a request error; the utility
  already logs-and-continues.
- **Email is reserved for leave-the-app events**, and never leaks secrets/full bodies — it links via
  `href`.
