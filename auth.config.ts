import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { env, features } from "@/lib/env";
import type { UserRole, UserStatus, PlatformAccess } from "@/db/schema/user";

/**
 * EDGE-SAFE Auth.js config. Imported by BOTH middleware.ts (Edge runtime) and auth.ts (Node).
 *
 * ⚠️  Nothing here may touch the database, Node crypto, or the credentials authorize() — those
 *     live in auth.ts on the Node runtime. Importing the DB/adapter into the Edge middleware
 *     kills cold-start performance and the reviewer will ask (rbac-guard rule #5).
 *
 * The Google provider is added only when its env vars are present, so the app boots with just
 * DATABASE_URL + AUTH_SECRET during Phase 0.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" }, // JWT so middleware can check a cookie without a DB round-trip
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    ...(features.googleAuth
      ? [
          Google({
            clientId: env.AUTH_GOOGLE_ID,
            clientSecret: env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true, // link Google to an existing email account
          }),
        ]
      : []),
    // Credentials provider is added in auth.ts (needs DB + scrypt — Node only).
  ],
  callbacks: {
    /** Persist id + tenancy fields onto the JWT on sign-in; keep them on subsequent calls. */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        if ("role" in user && user.role) token.role = user.role;
        if ("orgId" in user) token.orgId = user.orgId ?? null;
        if ("status" in user && user.status) token.status = user.status;
        if ("platformAccess" in user && user.platformAccess) {
          token.platformAccess = user.platformAccess;
        }
      }
      return token;
    },
    /** Expose id + tenancy on the session for requirePermission, scoping, and the UI. */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? session.user.id;
        session.user.role = (token.role as UserRole) ?? "employee";
        session.user.orgId = (token.orgId as string | null) ?? null;
        session.user.status = (token.status as UserStatus) ?? "active";
        session.user.platformAccess = (token.platformAccess as PlatformAccess) ?? "active";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
