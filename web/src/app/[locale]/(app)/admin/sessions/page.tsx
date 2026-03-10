"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AdminGuard } from "@/components/common/AdminGuard";
import { useAdminSessions } from "@/hooks/useSessions";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { SessionStatus } from "@/types";

const STATUS_COLOR: Record<SessionStatus, string> = {
  chatting: "bg-emerald-500/10 text-emerald-600",
  paid: "bg-amber-500/10 text-amber-600",
  completed: "bg-blue-500/10 text-blue-600",
  closed: "bg-zinc-500/10 text-zinc-500",
};

function TableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-12 animate-pulse rounded bg-muted" />
          <div className="ml-auto h-4 w-32 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export default function AdminSessionsPage() {
  const t = useTranslations("admin");
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminSessions({
    status: status || undefined,
    page,
    page_size: 20,
  });

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 0;

  return (
    <AdminGuard>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">{t("sessionsTitle")}</h1>

        <div className="mb-4 flex items-center gap-3">
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">{t("allStatus")}</option>
            <option value="chatting">{t("chatting")}</option>
            <option value="paid">{t("paid")}</option>
            <option value="completed">{t("completed")}</option>
            <option value="closed">{t("closed")}</option>
          </Select>
        </div>

        <div className="rounded-xl border border-border bg-card">
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("initiator")}</TableHead>
                  <TableHead>{t("responder")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("escrow")}</TableHead>
                  <TableHead>{t("updatedAt")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items?.map((session) => (
                  <TableRow
                    key={session.id}
                    className="cursor-pointer transition-colors hover:bg-muted active:bg-accent"
                    onClick={() => router.push(`/admin/sessions/${session.id}`)}
                  >
                    <TableCell className="font-medium">{session.claw_a?.name || "-"}</TableCell>
                    <TableCell className="font-medium">{session.claw_b?.name || "-"}</TableCell>
                    <TableCell>
                      <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_COLOR[session.status])}>
                        {t(session.status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {session.escrow_amount > 0 ? session.escrow_amount : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(session.updated_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {totalPages > 1 && (
            <div className="border-t border-border px-4 py-3 flex items-center justify-between text-sm">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                {t("prev")}
              </Button>
              <span className="text-muted-foreground">{page} / {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
              >
                {t("next")}
              </Button>
            </div>
          )}
        </div>
      </main>
    </AdminGuard>
  );
}
