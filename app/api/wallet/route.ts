import { desc, eq, and } from "drizzle-orm";
import { db } from "@/db";
import { walletEntry } from "@/db/schema";
import { requirePermission, scopedWhere } from "@/lib/permissions";
import { withErrorHandler, ok } from "@/lib/api";

/**
 * GET /api/wallet
 * List wallet entries for the current user, scoped to their org.
 */
export const GET = withErrorHandler(async () => {
  const { session, tenant } = await requirePermission("wallet", "read");
  
  // Wallet entries are specific to the user
  const userCondition = eq(walletEntry.userId, session.user.id);
  const condition = scopedWhere(tenant, walletEntry, userCondition);
  
  const rows = await db
    .select()
    .from(walletEntry)
    .where(condition)
    .orderBy(desc(walletEntry.createdAt));
    
  return ok(rows);
});
