import { redirect } from "next/navigation";

/**
 * Self-service sign-up is disabled — accounts are provisioned by the company (admin invites) and a
 * user's role is decided by their account, not chosen at sign-up. Any hit to /register is sent to
 * the sign-in page. Kept as a redirect (not deleted) so old links and bookmarks don't 404.
 */
export default function RegisterPage() {
  redirect("/login");
}
