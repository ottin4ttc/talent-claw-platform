"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AdminGuard } from "@/components/common/AdminGuard";
import { useAdminSession, useAdminMessages } from "@/hooks/useSessions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import type { Message, SessionStatus } from "@/types";

const STATUS_VARIANTS: Record<SessionStatus, "default" | "secondary"> = {
  chatting: "default",
  paid: "default",
  completed: "secondary",
  closed: "secondary",
};

function MessageBubble({ msg, clawAId }: { msg: Message; clawAId: string }) {
  const t = useTranslations("admin");
  const isSystem = msg.msg_type === "system";
  const isClawA = msg.sender_id === clawAId;

  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          {msg.content}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex", isClawA ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[70%] rounded-xl px-4 py-2",
          isClawA
            ? "bg-muted text-foreground"
            : "bg-primary text-primary-foreground"
        )}
      >
        {(msg.msg_type === "delivery" || msg.msg_type === "revision") && (
          <Badge variant="secondary" className="mb-1 text-xs">
            {t(msg.msg_type)}
          </Badge>
        )}
        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
        <p className={cn(
          "mt-1 text-xs",
          isClawA ? "text-muted-foreground" : "text-primary-foreground/70"
        )}>
          {new Date(msg.created_at).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

export default function AdminSessionDetailPage() {
  const t = useTranslations("admin");
  const params = useParams();
  const sessionId = params.id as string;

  const { data: session } = useAdminSession(sessionId);
  const { data: messagesData, isLoading } = useAdminMessages(sessionId);

  return (
    <AdminGuard>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/admin/sessions">
            <Button variant="outline" size="sm">{t("backToList")}</Button>
          </Link>
          <h1 className="text-2xl font-bold">{t("sessionDetail")}</h1>
        </div>

        {/* Session participants info */}
        {session && (
          <Card className="mb-6">
            <CardContent className="flex items-center gap-6 pt-6">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">{t("initiator")}</div>
                <div className="font-medium">{session.claw_a?.name || "—"}</div>
              </div>
              <div className="text-muted-foreground">↔</div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">{t("responder")}</div>
                <div className="font-medium">{session.claw_b?.name || "—"}</div>
              </div>
              <div className="ml-auto flex items-center gap-4">
                <Badge variant={STATUS_VARIANTS[session.status]}>
                  {t(session.status)}
                </Badge>
                {session.escrow_amount > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {t("escrow")}: {session.escrow_amount}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Messages */}
        <div className="rounded-xl border border-border bg-card p-4">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : !messagesData?.items.length ? (
            <div className="py-8 text-center text-muted-foreground">{t("noMessages")}</div>
          ) : (
            <div className="space-y-3">
              {messagesData.items.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  clawAId={session?.claw_a_id || ""}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </AdminGuard>
  );
}
