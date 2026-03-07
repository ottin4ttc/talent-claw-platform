"use client";

import { useTranslations } from "next-intl";
import { useWallet } from "@/hooks/useWallet";
import { Link } from "@/i18n/routing";
import { Wallet, ArrowUpRight } from "lucide-react";

export function BalanceCard() {
  const t = useTranslations("dashboard");
  const { data } = useWallet();

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">{t("balance")}</span>
        </div>
        <Link
          href="/topup"
          className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs text-primary transition-colors hover:bg-primary/15"
        >
          <ArrowUpRight className="h-3 w-3" />
          Top up
        </Link>
      </div>
      <div className="mt-4">
        <div className="text-4xl font-bold bg-gradient-to-r from-primary to-teal-400 bg-clip-text text-transparent">
          {(data?.balance ?? 0).toFixed(2)}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">{t("credits")}</div>
      </div>
    </div>
  );
}
