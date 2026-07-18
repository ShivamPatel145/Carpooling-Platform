import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { account, session, user, verificationToken } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { authConfig } from "@/auth.config";

/**
 * FULL Auth.js setup — Node runtime only. Adds the Drizzle adapter and the credentials provider
 * (both need the DB; credentials also needs scrypt). Middleware imports auth.config.ts instead,
 * NOT this file (rbac-guard rule #5: keep the auth stack out of the Edge runtime).
 */

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: user,
    accountsTable: account,
    sessionsTable: session,
    verificationTokensTable: verificationToken,
  }),
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const found = await db.query.user.findFirst({
          where: eq(user.email, email.toLowerCase()),
        });
        // Block inactive membership and revoked platform access at sign-in.
        if (!found || !found.passwordHash) return null;
        if (found.status === "inactive" || found.platformAccess === "revoked") return null;

        const ok = await verifyPassword(password, found.passwordHash);
        if (!ok) return null;

        // Returned object seeds the JWT (tenancy fields picked up in the jwt callback).
        return {
          id: found.id,
          email: found.email,
          name: found.name,
          image: found.image,
          role: found.role,
          orgId: found.orgId,
          status: found.status,
          platformAccess: found.platformAccess,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    /**
     * Extends the edge-safe jwt callback with a DB read: on an explicit session refresh
     * (trigger === "update") — or if the token is ever missing its tenancy context — reload the
     * full role/org from the DB so scoping + access checks stay correct. Runs on Node.
     */
    async jwt({ token, user: signedInUser, trigger }) {
      // Delegate id/role-from-user to the shared callback first.
      const base = await authConfig.callbacks!.jwt!({ token, user: signedInUser } as never);
      const t = base as typeof token;

      // Reload tenancy context from the DB on refresh, or if it's somehow absent.
      if ((!t.role || t.orgId === undefined || trigger === "update") && t.sub) {
        const row = await db.query.user.findFirst({
          where: eq(user.id, t.sub),
          columns: { id: true, role: true, orgId: true, status: true, platformAccess: true },
        });
        if (row) {
          t.id = row.id;
          t.role = row.role;
          t.orgId = row.orgId;
          t.status = row.status;
          t.platformAccess = row.platformAccess;
        }
      }
      return t;
    },
  },
});
