"use client";

import { useTranslations } from "next-intl";
import { AuthGuard } from "@/components/common/AuthGuard";
import { useAuthStore } from "@/stores/authStore";
import { maskPhone } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const { user } = useAuthStore();

  return (
    <AuthGuard>
      <main className="mx-auto max-w-xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">{t("title")}</h1>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("nickname")}</span>
              <span className="text-sm font-medium">{user?.nickname || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("phone")}</span>
              <span className="font-mono text-sm">{user?.phone ? maskPhone(user.phone) : "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("version")}</span>
              <span className="font-mono text-sm">0.0.1-beta</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("author")}</span>
              <span className="text-sm font-medium">Tis</span>
            </div>
          </CardContent>
        </Card>
      </main>
    </AuthGuard>
  );
}
