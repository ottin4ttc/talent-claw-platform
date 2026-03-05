"use client";

import { useTranslations } from "next-intl";
import { useTransactions } from "@/hooks/useTransactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/routing";

export function RecentTransactions() {
  const t = useTranslations("dashboard");
  const { data } = useTransactions({ page_size: 5 });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("recentTransactions")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data?.items.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{tx.memo || tx.type}</span>
              <span className={tx.amount >= 0 ? "text-primary" : "text-destructive"}>{tx.amount}</span>
            </div>
          ))}
        </div>
        <Link href="/transactions" className="mt-3 inline-block text-sm text-primary underline">
          {t("transactions")}
        </Link>
      </CardContent>
    </Card>
  );
}
