import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { demoEntity } from "@/db/schema";
import { requirePermission } from "@/lib/permissions";
import { withErrorHandler, ok } from "@/lib/api";

/** GET /api/demo-entity/my — only the current user's items. */
export const GET = withErrorHandler(async () => {
  const { session } = await requirePermission("demoEntity", "read");
  const rows = await db
    .select()
    .from(demoEntity)
    .where(eq(demoEntity.ownerId, session.user.id))
    .orderBy(desc(demoEntity.createdAt));
  return ok(rows);
});
