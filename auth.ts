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
     * Extends the edge-safe jwt callback with a DB read: OAuth sign-ins (Google) don't carry a
     * role, so on first sign-in we look it up from the adapter-created user row. Runs on Node.
     */
    async jwt({ token, user: signedInUser, trigger }) {
      // Delegate id/role-from-user to the shared callback first.
      const base = await authConfig.callbacks!.jwt!({ token, user: signedInUser } as never);
      const t = base as typeof token;

      // If we still have no role (e.g. Google first sign-in) or an explicit refresh, load the
      // full tenancy context from the DB so scoping + access checks have it.
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
  events: {
    /** First-ever sign-in via OAuth: the adapter just created the user with the default role. */
    async createUser() {
      // default role is set by the DB column default ("user"); nothing to do here yet.
      // Hook kept as the seam for build-day domain onboarding logic.
    },
  },
});
