import { handlers } from "@/auth";

/** Auth.js catch-all route (Node runtime — it imports the DB adapter). */
export const { GET, POST } = handlers;
