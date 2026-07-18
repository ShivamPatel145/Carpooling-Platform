import { db } from "./db";
import { walletEntry } from "./db/schema";
import { eq, desc } from "drizzle-orm";

async function run() {
  try {
    const orgId = "00000000-0000-0000-0000-000000000000"; // I need a real orgId and userId
    
    const [latest] = await db.select().from(walletEntry).limit(1);
    if (!latest) {
      console.log("No wallet entries found to mock against.");
    }
    console.log("Success");
  } catch (e) {
    console.error(e);
  }
}
run();
