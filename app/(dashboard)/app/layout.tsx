import { redirect } from "next/navigation";
import { requireSession, homeForRole } from "@/lib/session";

/**
 * The employee app (`/app/*`) — the mode-switcher hub where an employee both OFFERS and FINDS rides.
 * The (dashboard) layout above already validated the session and rendered the shell. Here we gate
 * the SURFACE to the employee role: super_admin and company_admin have their own consoles
 * (/platform, /admin) and are bounced there. homeForRole("employee") === "/app", so this is the
 * landing employees are redirected to after login.
 */
export default async function EmployeeAppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  if (session.user.role !== "employee") {
    redirect(homeForRole(session.user.role));
  }
  return <>{children}</>;
}
