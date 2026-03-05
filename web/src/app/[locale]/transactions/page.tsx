"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AuthGuard } from "@/components/common/AuthGuard";
import { useTransactions } from "@/hooks/useTransactions";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TransactionType } from "@/types";

export default function TransactionsPage() {
  const t = useTranslations("transactions");
  const [type, setType] = useState<TransactionType | "">("");
  const [page, setPage] = useState(1);

  const { data } = useTransactions({ type: type || undefined, page, page_size: 20 });

  const options = useMemo(
    () => ["topup", "escrow_hold", "escrow_release", "escrow_refund"] as const,
    []
  );

  return (
    <AuthGuard>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">{t("title")}</h1>

        <div className="mb-4 flex items-center gap-3">
          <Select value={type} onChange={(e) => setType(e.target.value as TransactionType | "")}> 
            <option value="">{t("all")}</option>
            {options.map((item) => (
              <option key={item} value={item}>{t(item)}</option>
            ))}
          </Select>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
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
              {data?.items?.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{new Date(tx.created_at).toLocaleString()}</TableCell>
                  <TableCell>{t(tx.type)}</TableCell>
                  <TableCell className={tx.amount >= 0 ? "text-primary" : "text-destructive"}>
                    {tx.amount}
                  </TableCell>
                  <TableCell>{tx.memo || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 flex items-center justify-between text-sm">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
            <span>{page}</span>
            <button type="button" onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
