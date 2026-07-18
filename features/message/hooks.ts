"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";
import { toast } from "@/hooks/use-toast";
import type { MessageView } from "@/features/message/schema";

/** Query key per trip thread. */
const msgKey = (tripId: string) => ["message", tripId] as const;

/** Append a message to the cached thread, de-duped by id (used by send + Pusher echo). */
export function appendMessage(qc: QueryClient, tripId: string, msg: MessageView) {
  qc.setQueryData<MessageView[]>(msgKey(tripId), (old = []) =>
    old.some((m) => m.id === msg.id) ? old : [...old, msg],
  );
}

export function useMessages(tripId: string) {
  return useQuery({
    queryKey: msgKey(tripId),
    queryFn: () => api.get<MessageView[]>(`/api/message?tripId=${tripId}`),
    // Polling fallback so chat still delivers if the Pusher socket is down (the hour-6 decision).
    refetchInterval: 8000,
  });
}

export function useSendMessage(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api.post<MessageView>("/api/message", { tripId, body }),
    onSuccess: (msg) => appendMessage(qc, tripId, msg),
    onError: (err: Error) =>
      toast({ variant: "destructive", title: "Message not sent", description: err.message }),
  });
}
