"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/states";
import { cn, formatDateTime } from "@/lib/utils";
import { features } from "@/lib/client-features";
import { getPusherClient } from "@/lib/pusher/client";
import { PUSHER_EVENTS, tripChannel } from "@/lib/pusher/channels";
import { appendMessage, useMessages, useSendMessage } from "@/features/message/hooks";
import type { MessageView } from "@/features/message/schema";

/**
 * Per-trip chat panel (PRD §7.7). Delivered over the SAME Pusher channel as tracking (one realtime
 * system); incoming messages append to the cache (de-duped), with an 8s poll fallback. Persists
 * across reload (DB-backed). `mine` is derived from the session user id so pushed + fetched messages
 * render identically.
 */
export function TripChat({ tripId, title = "Chat" }: { tripId: string; title?: string }) {
  const { data: session } = useSession();
  const myId = session?.user?.id;
  const qc = useQueryClient();
  const { data: messages, isLoading } = useMessages(tripId);
  const send = useSendMessage(tripId);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Instant incoming messages over Pusher; append de-duped (poll is the fallback).
  useEffect(() => {
    if (!features.realtime) return;
    const client = getPusherClient();
    if (!client) return;
    const ch = client.subscribe(tripChannel(tripId));
    const onMsg = (m: MessageView) => appendMessage(qc, tripId, m);
    ch.bind(PUSHER_EVENTS.message, onMsg);
    return () => {
      ch.unbind(PUSHER_EVENTS.message, onMsg);
      // don't unsubscribe — the tracking view may share this channel on the same page
    };
  }, [tripId, qc]);

  // Keep the thread scrolled to the latest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages?.length]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || send.isPending) return;
    send.mutate(body);
    setText("");
  }

  return (
    <Card id="trip-chat">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div ref={scrollRef} className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {isLoading ? (
            <Spinner label="Loading messages…" />
          ) : !messages?.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No messages yet — start the conversation.
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.senderId === myId;
              return (
                <div key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                      mine ? "bg-accent text-accent-foreground" : "bg-muted",
                    )}
                  >
                    {!mine && (
                      <p className="mb-0.5 text-xs font-medium opacity-80">{m.senderName ?? "Them"}</p>
                    )}
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  </div>
                  <span className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                    {formatDateTime(m.createdAt)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={submit} className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            maxLength={2000}
            aria-label="Message"
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={send.isPending || !text.trim()} aria-label="Send message">
            {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
