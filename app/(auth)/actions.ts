"use server";

import { signIn, signOut } from "@/auth";

/** Server action: sign out and return to the homepage. */
export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

/** Server action: kick off Google OAuth. */
export async function signInWithGoogle(callbackUrl?: string) {
  await signIn("google", { redirectTo: callbackUrl || "/dashboard" });
}
