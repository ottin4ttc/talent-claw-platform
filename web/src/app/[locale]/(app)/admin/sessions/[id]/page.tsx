"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Bot, User, FileCheck, MessageSquareDiff, Info } from "lucide-react";
import { AdminGuard } from "@/components/common/AdminGuard";
import { useAdminSession, useAdminMessages } from "@/hooks/useSessions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import type { Message, SessionStatus } from "@/types";

const STATUS_COLOR: Record<SessionStatus, string> = {
  chatting: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  paid: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  completed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  closed: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
};

function MessageBubble({
  msg,
  clawAId,
  clawAName,
  clawBName,
}: {
  msg: Message;
  clawAId: string;
  clawAName: string;
  clawBName: string;
}) {
  const t = useTranslations("admin");
  const isSystem = msg.msg_type === "system";
  const isClawA = msg.sender_id === clawAId;
  const senderName = isClawA ? clawAName : clawBName;

  if (isSystem) {
    return (
      <div className="flex items-center justify-center gap-2 py-3">
        <div className="h-px flex-1 bg-border" />
        <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          <Info className="h-3 w-3" />
          {msg.content}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
    );
  }

  const isDelivery = msg.msg_type === "delivery";
  const isRevision = msg.msg_type === "revision";

  return (
    <div className={cn("flex gap-3", isClawA ? "flex-row" : "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium",
          isClawA
            ? "bg-violet-500/10 text-violet-600"
            : "bg-cyan-500/10 text-cyan-600"
        )}
      >
        {isClawA ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Bubble */}
      <div className={cn("max-w-[75%] space-y-1", isClawA ? "items-start" : "items-end")}>
        {/* Sender name */}
        <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", !isClawA && "flex-row-reverse")}>
          <span className="font-medium">{senderName}</span>
          <span>{new Date(msg.created_at).toLocaleTimeString()}</span>
        </div>

        {/* Message type badge */}
        {(isDelivery || isRevision) && (
          <div className={cn("flex", !isClawA && "justify-end")}>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                isDelivery && "bg-emerald-500/10 text-emerald-600",
                isRevision && "bg-amber-500/10 text-amber-600"
              )}
            >
              {isDelivery && <FileCheck className="h-3 w-3" />}
              {isRevision && <MessageSquareDiff className="h-3 w-3" />}
              {t(msg.msg_type)}
            </span>
          </div>
        )}

        {/* Content */}
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isClawA
              ? "rounded-tl-md bg-muted text-foreground"
              : "rounded-tr-md bg-primary/10 text-foreground",
            isDelivery && "border border-emerald-500/20 bg-emerald-500/5",
            isRevision && "border border-amber-500/20 bg-amber-500/5"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        </div>
      </div>
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className="space-y-4 p-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className={cn("flex gap-3", i % 2 === 0 ? "" : "flex-row-reverse")}>
          <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            <div className={cn("h-16 animate-pulse rounded-2xl bg-muted", i % 2 === 0 ? "w-64" : "w-48")} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminSessionDetailPage() {
  const t = useTranslations("admin");
  const params = useParams();
  const sessionId = params.id as string;
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: session, isLoading: sessionLoading } = useAdminSession(sessionId);
  const { data: messagesData, isLoading: messagesLoading } = useAdminMessages(sessionId);

  // Auto-scroll to bottom when messages load
  useEffect(() => {
    if (messagesData?.items?.length) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesData]);

  const isLoading = sessionLoading || messagesLoading;

  return (
    <AdminGuard>
      <main className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col px-4 py-4">
        {/* Header */}
        <div className="mb-4 flex items-center gap-4">
          <Link href="/admin/sessions">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              {t("backToList")}
            </Button>
          </Link>

          {session && (
            <div className="ml-auto flex items-center gap-3">
              <div className="text-right text-sm">
                <span className="font-medium">{session.claw_a?.name || "—"}</span>
                <span className="mx-2 text-muted-foreground">↔</span>
                <span className="font-medium">{session.claw_b?.name || "—"}</span>
              </div>
              <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", STATUS_COLOR[session.status])}>
                {t(session.status)}
              </span>
              {session.escrow_amount > 0 && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                  {t("escrow")}: {session.escrow_amount}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-border bg-card">
          {isLoading ? (
            <ChatSkeleton />
          ) : !messagesData?.items?.length ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              {t("noMessages")}
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {/* Session start indicator */}
              <div className="flex items-center justify-center gap-2 pb-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">
                  {new Date(messagesData.items[0].created_at).toLocaleDateString()}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {messagesData.items.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  clawAId={session?.claw_a_id || ""}
                  clawAName={session?.claw_a?.name || "Claw A"}
                  clawBName={session?.claw_b?.name || "Claw B"}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </main>
    </AdminGuard>
  );
}
