import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  
  // Check employee user
  const users = await sql`
    SELECT email, status, platform_access, 
           substring(password_hash, 1, 30) as hash_prefix,
           password_hash IS NOT NULL as has_hash 
    FROM "user" 
    WHERE email IN ('employee@demo.dev', 'rider@demo.dev', 'admin@demo.dev')
  `;
  console.log("USERS:", JSON.stringify(users, null, 2));
  
  // Check recent wallet entries
  const entries = await sql`
    SELECT we.id, we.user_id, we.delta, we.reason, we.balance_after, we.created_at
    FROM wallet_entry we
    ORDER BY we.created_at DESC
    LIMIT 10
  `;
  console.log("WALLET ENTRIES:", JSON.stringify(entries, null, 2));
  
  // Check payments
  const payments = await sql`
    SELECT id, stripe_payment_intent_id, amount, status, payer_id, created_at
    FROM payment
    ORDER BY created_at DESC
    LIMIT 5
  `;
  console.log("PAYMENTS:", JSON.stringify(payments, null, 2));
}

main().catch(console.error);
