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

/** Prefixes that require a signed-in user. Public routes (/, /login, /register) are excluded. */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/app",
  "/admin",
  "/manager",
  "/approver",
  "/settings",
  "/notifications",
  "/support",
  "/reports",
];

const AUTH_PAGES = ["/login", "/register"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = Boolean(req.auth?.user);
  const path = nextUrl.pathname;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );
  const isAuthPage = AUTH_PAGES.some((p) => path === p || path.startsWith(`${p}/`));

  // Signed-in users shouldn't see the login/register pages.
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
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
