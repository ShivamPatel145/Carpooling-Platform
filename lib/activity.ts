import { db } from "@/db";
import { activityLog } from "@/db/schema";
import { logger } from "@/lib/logger";

/**
 * logActivity — the ONLY way to write the audit trail. Every MUTATING route calls this after a
 * successful write (rbac-guard: "closes with logActivity if it mutates"). A hole here is what a
 * reviewer probes. Never throws into the request path — an audit failure must not fail the action.
 */
export interface LogActivityInput {
  /** tenant — pass session.user.orgId so the admin's audit view can scope to its org */
  orgId?: string | null;
  actorId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
  /** pass the Request to auto-capture IP + user-agent */
  req?: Request;
  ip?: string | null;
  userAgent?: string | null;
}

function ipFromRequest(req?: Request): string | null {
  if (!req) return null;
  const h = req.headers;
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null
  );
}

export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    await db.insert(activityLog).values({
      orgId: input.orgId ?? null,
      actorId: input.actorId ?? null,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId ?? null,
      metadata: input.metadata,
      ip: input.ip ?? ipFromRequest(input.req),
      userAgent: input.userAgent ?? input.req?.headers.get("user-agent") ?? null,
    });
  } catch (err) {
    // Never break the request because the audit insert failed — just record it.
    logger.error("logActivity failed", { action: input.action, resource: input.resource, err });
  }
}
