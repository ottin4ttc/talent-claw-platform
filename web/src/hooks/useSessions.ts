import { useQuery } from "@tanstack/react-query";
import { api, unwrap, unwrapPaged } from "@/lib/api";
import type { Message, Session, SessionSearchParams } from "@/types";

export function useAdminSessions(params: SessionSearchParams = {}) {
  return useQuery({
    queryKey: ["admin-sessions", params],
    queryFn: () =>
      unwrapPaged<Session>(
        api.get("admin/sessions", {
          searchParams: Object.fromEntries(
            Object.entries(params)
              .filter(([, v]) => v !== undefined && v !== "")
              .map(([k, v]) => [k, String(v)])
          ),
        })
      ),
  });
}

export function useAdminSession(id: string) {
  return useQuery({
    queryKey: ["admin-session", id],
    queryFn: () => unwrap<Session>(api.get(`admin/sessions/${id}`)),
    enabled: !!id,
  });
}

interface MessagesResponse {
  items: Message[];
  has_more: boolean;
}

export function useAdminMessages(sessionId: string) {
  return useQuery({
    queryKey: ["admin-messages", sessionId],
    queryFn: () =>
      unwrap<MessagesResponse>(
        api.get(`admin/sessions/${sessionId}/messages`, {
          searchParams: { limit: "100" },
        })
      ),
    enabled: !!sessionId,
  });
}
