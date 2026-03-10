"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AuthGuard } from "@/components/common/AuthGuard";
import { useAuthStore } from "@/stores/authStore";
import { useTransactions } from "@/hooks/useTransactions";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Transaction, TransactionType } from "@/types";

function formatAmount(tx: Transaction, userId: string) {
  const isOutgoing = tx.from_id === userId;
  const isIncoming = tx.to_id === userId;
  if (isOutgoing && !isIncoming) return { text: `-${tx.amount}`, negative: true };
  if (isIncoming && !isOutgoing) return { text: `+${tx.amount}`, negative: false };
  return { text: `${tx.amount}`, negative: false };
}

export default function TransactionsPage() {
  const t = useTranslations("transactions");
  const { user } = useAuthStore();
  const [type, setType] = useState<TransactionType | "">("");
  const [page, setPage] = useState(1);

  const { data } = useTransactions({ type: type || undefined, page, page_size: 20 });
  const totalPages = data ? Math.ceil(data.total / data.page_size) : 0;

  const options = useMemo(
    () => ["topup", "escrow_hold", "escrow_release", "escrow_refund"] as const,
    []
  );

  return (
    <AuthGuard>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">{t("title")}</h1>

        <div className="mb-4 flex items-center gap-3">
          <Select value={type} onChange={(e) => { setType(e.target.value as TransactionType | ""); setPage(1); }}>
            <option value="">{t("all")}</option>
            {options.map((item) => (
              <option key={item} value={item}>{t(item)}</option>
            ))}
          </Select>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("time")}</TableHead>
                <TableHead>{t("type")}</TableHead>
                <TableHead>{t("amount")}</TableHead>
                <TableHead>{t("memo")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items?.map((tx) => {
                const amt = formatAmount(tx, user?.id || "");
                return (
                  <TableRow key={tx.id}>
                    <TableCell>{new Date(tx.created_at).toLocaleString()}</TableCell>
                    <TableCell>{t(tx.type)}</TableCell>
                    <TableCell className={amt.negative ? "font-medium text-destructive" : "font-medium text-emerald-600"}>
                      {amt.text}
                    </TableCell>
                    <TableCell>{tx.memo || "-"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

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
    </AuthGuard>
  );
}
