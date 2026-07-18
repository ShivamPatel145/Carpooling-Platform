import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

/**
 * EDGE-SAFE middleware (rbac-guard rule #5). It instantiates Auth.js from the edge-safe config
 * ONLY (no DB adapter, no credentials authorize, no Node crypto) and checks for the presence of a
 * valid session token to redirect unauthenticated users off protected prefixes.
 *
 * This is a GATE, not authorization. Full role/session validation happens in server components
 * and in every route via requirePermission(). A hidden nav item is not authorization; neither is
 * this redirect.
 */
const { auth } = NextAuth(authConfig);

/**
 * Prefixes that require a signed-in user. Public routes (/, /login, /register, /accept-invite) are
 * excluded. These MUST track the real role homes from lib/session#homeForRole — /app (employee),
 * /admin (company_admin), /platform (super_admin) — plus the shared employee surfaces.
 */
const PROTECTED_PREFIXES = [
  "/app",
  "/admin",
  "/platform",
  "/reports",
  "/wallet",
  "/history",
  "/pay",
  "/settings",
  "/notifications",
  "/support",
  "/dashboard",
];

const AUTH_PAGES = ["/login", "/register"];

/** Edge-safe mirror of lib/session#homeForRole (can't import that — it pulls the Node auth stack). */
function homeForRole(role: string | undefined): string {
  if (role === "super_admin") return "/platform";
  if (role === "company_admin") return "/admin";
  return "/app";
}

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = Boolean(req.auth?.user);
  const path = nextUrl.pathname;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );
  const isAuthPage = AUTH_PAGES.some((p) => path === p || path.startsWith(`${p}/`));

  // Signed-in users shouldn't see the login/register pages — send them to their role home.
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL(homeForRole(req.auth?.user?.role), nextUrl));
  }

  // Unauthenticated users hitting a protected prefix → login with a return path.
  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", path + nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Run on everything except static assets, image optimizer, and the auth API itself.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
