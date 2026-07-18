import { desc, eq, and } from "drizzle-orm";
import { db } from "@/db";
import { walletEntry } from "@/db/schema";
import { requirePermission, scopedWhere } from "@/lib/permissions";
import { withErrorHandler, ok } from "@/lib/api";

/**
 * GET /api/wallet/balance
 * Get the current wallet balance (derived from the latest entry's balanceAfter).
 */
export const GET = withErrorHandler(async () => {
  const { session, tenant } = await requirePermission("wallet", "read");
  
  const userCondition = eq(walletEntry.userId, session.user.id);
  const condition = scopedWhere(tenant, walletEntry, userCondition);
  
  const [latest] = await db
    .select({ balanceAfter: walletEntry.balanceAfter })
    .from(walletEntry)
    .where(condition)
    .orderBy(desc(walletEntry.createdAt))
    .limit(1);
    
  return ok({ balance: latest ? Number(latest.balanceAfter) : 0 });
});
