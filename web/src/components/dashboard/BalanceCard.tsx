"use client";

import { useTranslations } from "next-intl";
import { useWallet } from "@/hooks/useWallet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/routing";

export function BalanceCard() {
  const t = useTranslations("dashboard");
  const { data } = useWallet();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("balance")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-2 text-4xl font-bold text-primary">{(data?.balance ?? 0).toFixed(2)}</div>
        <div className="text-sm text-muted-foreground">{t("credits")}</div>
        <Link href="/topup" className="mt-3 inline-block text-sm text-primary underline">
          Top up
        </Link>
      </CardContent>
    </Card>
  );
}
