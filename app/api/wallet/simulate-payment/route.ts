import { requirePermission } from "@/lib/permissions";
import { withErrorHandler, ok } from "@/lib/api";
import { db } from "@/db";
import { walletEntry } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { logActivity } from "@/lib/activity";

const schema = z.object({ amount: z.number().min(1) });

export const POST = withErrorHandler(async (req: Request) => {
  const { session, tenant } = await requirePermission("wallet", "recharge");
  const { amount } = schema.parse(await req.json());

  const [latest] = await db.select({ balanceAfter: walletEntry.balanceAfter })
    .from(walletEntry)
    .where(eq(walletEntry.userId, session.user.id))
    .orderBy(desc(walletEntry.createdAt))
    .limit(1);

  const currentBalance = latest ? Number(latest.balanceAfter) : 0;
  const newBalance = currentBalance + amount;

  await db.insert(walletEntry).values({
    orgId: tenant.orgId!,
    userId: session.user.id,
    delta: amount.toString(),
    reason: "recharge",
    balanceAfter: newBalance.toString(),
  });

  await logActivity({
    orgId: tenant.orgId,
    actorId: session.user.id,
    action: "create",
    resource: "wallet",
    metadata: { action: "simulated_recharge", amount },
    req,
  });

  return ok({ success: true, balance: newBalance });
});
