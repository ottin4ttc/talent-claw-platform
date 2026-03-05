"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AuthGuard } from "@/components/common/AuthGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTopup } from "@/hooks/useWallet";

const PRESET = [10, 50, 100, 500];

export default function TopupPage() {
  const t = useTranslations("topup");
  const topup = useTopup();
  const [amount, setAmount] = useState<number>(100);

  const submit = async () => {
    await topup.mutateAsync({ amount });
    toast.success(t("success"));
  };

  return (
    <AuthGuard>
      <main className="mx-auto max-w-xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">{t("title")}</h1>

        <div className="rounded-xl border border-border bg-card p-6">
          <p className="mb-3 text-sm text-muted-foreground">{t("selectAmount")}</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {PRESET.map((v) => (
              <Button key={v} variant={amount === v ? "default" : "outline"} onClick={() => setAmount(v)}>
                {v}
              </Button>
            ))}
          </div>

          <p className="mb-2 text-sm text-muted-foreground">{t("customAmount")}</p>
          <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value || 0))} />

          <Button className="mt-4 w-full" onClick={submit} disabled={amount <= 0 || topup.isPending}>
            {t("confirmTopup")}
          </Button>
        </div>
      </main>
    </AuthGuard>
  );
}
