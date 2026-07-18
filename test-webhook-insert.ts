import { db } from "./db";
import { walletEntry, user, organization } from "./db/schema";
import { eq, desc } from "drizzle-orm";

async function run() {
  try {
    const [u] = await db.select().from(user).limit(1);
    if (!u) throw new Error("No user found");
    const [org] = await db.select().from(organization).limit(1);

    const amount = 500;
    
    console.log("Attempting insert...");
    
    await db.insert(walletEntry).values({
      orgId: org.id,
      userId: u.id,
      delta: amount.toString(),
      reason: "recharge",
      balanceAfter: amount.toString(),
    });

    console.log("Insert successful! Cleaning up...");
    
    // Cleanup
    await db.delete(walletEntry).where(eq(walletEntry.userId, u.id));
    console.log("Cleanup successful.");

  } catch (e) {
    console.error("Test failed with error:", e);
  }
}
run();
