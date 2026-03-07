"use client";

import { useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/authStore";
import { useTransactions } from "@/hooks/useTransactions";
import { Link } from "@/i18n/routing";
import { ArrowRight, TrendingUp } from "lucide-react";
import type { Transaction } from "@/types";

function formatAmount(tx: Transaction, userId: string) {
  const isOutgoing = tx.from_id === userId;
  const isIncoming = tx.to_id === userId;

  if (isOutgoing && !isIncoming) return { text: `-${tx.amount}`, negative: true };
  if (isIncoming && !isOutgoing) return { text: `+${tx.amount}`, negative: false };
  return { text: `${tx.amount}`, negative: false };
}

export function RecentTransactions() {
  const t = useTranslations("dashboard");
  const { user } = useAuthStore();
  const { data } = useTransactions({ page_size: 5 });

  return (
    <div className="glass-card rounded-2xl p-6 sm:col-span-2 lg:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">{t("recentTransactions")}</span>
        </div>
        <Link
          href="/transactions"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {t("transactions")} <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {!data?.items?.length ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{t("noTransactions")}</p>
      ) : (
        <div className="space-y-2">
          {data.items.map((tx) => {
            const amt = formatAmount(tx, user?.id || "");
            return (
              <div key={tx.id} className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/30">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{tx.memo || tx.type}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(tx.created_at).toLocaleString()}
                  </span>
                </div>
                <span className={`text-sm font-semibold ${amt.negative ? "text-destructive" : "text-emerald-500"}`}>
                  {amt.text}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
