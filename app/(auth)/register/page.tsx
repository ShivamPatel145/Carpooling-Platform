import { redirect } from "next/navigation";

/**
 * Self-service sign-up is disabled — onboarding is invite-only: the super admin creates
 * organizations (Path 1) and each company invites or creates its employees (Path 2, /accept-invite).
 * A user's role is decided by their account, never chosen at sign-up. Any hit to /register is sent
 * to the sign-in page. Kept as a redirect (not deleted) so old links and bookmarks don't 404.
 */
export default function RegisterPage() {
  redirect("/login");
}
