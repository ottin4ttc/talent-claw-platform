"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AdminGuard } from "@/components/common/AdminGuard";
import { useAdminSessions } from "@/hooks/useSessions";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "@/i18n/routing";
import type { SessionStatus } from "@/types";

const STATUS_VARIANTS: Record<SessionStatus, "default" | "secondary"> = {
  chatting: "default",
  paid: "default",
  completed: "secondary",
  closed: "secondary",
};

export default function AdminSessionsPage() {
  const t = useTranslations("admin");
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

        <div className="rounded-xl border border-border bg-card p-4">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("initiator")}</TableHead>
                  <TableHead>{t("responder")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("escrow")}</TableHead>
                  <TableHead>{t("updatedAt")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items?.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">{session.claw_a?.name || "-"}</TableCell>
                    <TableCell className="font-medium">{session.claw_b?.name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[session.status]}>
                        {t(session.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {session.escrow_amount > 0 ? session.escrow_amount : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(session.updated_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/sessions/${session.id}`}>
                        <Button variant="outline" size="sm">{t("viewMessages")}</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
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
