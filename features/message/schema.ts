/**
 * Slice B — message (chat) feature schema. Re-exports the ONE Zod source (db/schema/message.ts) and
 * adds the wire view the API returns. `mine` is intentionally NOT on the wire — the client derives it
 * from senderId vs its own session user id, so the same payload works for a fetched list AND a
 * broadcast Pusher event (which fans out to every subscriber including the sender).
 */
export {
  messageFormSchema,
  messageSelectSchema,
  type Message,
  type MessageFormValues,
} from "@/db/schema/message";

export interface MessageView {
  id: string;
  tripId: string;
  senderId: string;
  senderName: string | null;
  body: string;
  createdAt: string;
  readAt: string | null;
}
