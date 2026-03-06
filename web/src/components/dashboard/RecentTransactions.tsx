"use client";

import { useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/authStore";
import { useTransactions } from "@/hooks/useTransactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import type { Transaction } from "@/types";

function formatAmount(tx: Transaction, userId: string) {
  // from_id = money out, to_id = money in
  const isOutgoing = tx.from_id === userId;
  const isIncoming = tx.to_id === userId;

  if (isOutgoing && !isIncoming) return { text: `-${tx.amount}`, negative: true };
  if (isIncoming && !isOutgoing) return { text: `+${tx.amount}`, negative: false };
  // both or neither — show as-is
  return { text: `${tx.amount}`, negative: false };
}

export function RecentTransactions() {
  const t = useTranslations("dashboard");
  const { user } = useAuthStore();
  const { data } = useTransactions({ page_size: 5 });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("recentTransactions")}</CardTitle>
      </CardHeader>
      <CardContent>
        {!data?.items?.length ? (
          <p className="text-sm text-muted-foreground">{t("noTransactions")}</p>
        ) : (
          <div className="space-y-2">
            {data.items.map((tx) => {
              const amt = formatAmount(tx, user?.id || "");
              return (
                <div key={tx.id} className="flex items-center justify-between text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium">{tx.memo || tx.type}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleString()}
                    </span>
                  </div>
                  <span className={amt.negative ? "font-medium text-destructive" : "font-medium text-emerald-600"}>
                    {amt.text}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <Link href="/transactions" className="mt-3 inline-block text-sm text-primary underline">
          {t("transactions")}
        </Link>
      </CardContent>
    </Card>
  );
}
