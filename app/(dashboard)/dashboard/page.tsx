import { redirect } from "next/navigation";
import { requireSession, homeForRole } from "@/lib/session";

/**
 * `/dashboard` is a legacy landing alias kept because several links (login callback, Google sign-in,
 * marketing CTAs) still point here. It simply forwards to the caller's real console home:
 * employee → /app, company_admin → /admin, super_admin → /platform.
 */
export default async function DashboardRedirect() {
  const session = await requireSession();
  redirect(homeForRole(session.user.role));
}
