import type { DefaultSession } from "next-auth";
import type { UserRole, UserStatus, PlatformAccess } from "@/db/schema/user";

/**
 * Module augmentation so session.user.{id,role,orgId,status,platformAccess} are typed everywhere
 * (requirePermission, tenancy scoping, UI, server components). Keeps us from casting at call sites.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      /** tenant — null only for super_admin (cross-tenant) */
      orgId: string | null;
      status: UserStatus;
      platformAccess: PlatformAccess;
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole;
    orgId?: string | null;
    status?: UserStatus;
    platformAccess?: PlatformAccess;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    orgId?: string | null;
    status?: UserStatus;
    platformAccess?: PlatformAccess;
  }
}
