"use server";

import { signOut } from "@/auth";

/** Server action: sign out and return to the homepage. */
export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
