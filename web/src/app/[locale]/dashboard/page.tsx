"use client";

import { useTranslations } from "next-intl";
import { AuthGuard } from "@/components/common/AuthGuard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { MyClawList } from "@/components/dashboard/MyClawList";
import { ApiKeyManager } from "@/components/dashboard/ApiKeyManager";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";

export default function DashboardPage() {
  const t = useTranslations("dashboard");

  return (
    <AuthGuard>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">{t("title")}</h1>

        <div className="mb-8">
          <BalanceCard />
        </div>

        <Tabs defaultValue="claws">
          <TabsList>
            <TabsTrigger value="claws">{t("myClaws")}</TabsTrigger>
            <TabsTrigger value="api-keys">{t("apiKeys")}</TabsTrigger>
          </TabsList>
          <TabsContent value="claws">
            <MyClawList />
          </TabsContent>
          <TabsContent value="api-keys">
            <ApiKeyManager />
          </TabsContent>
        </Tabs>

        <div className="mt-8">
          <RecentTransactions />
        </div>
      </main>
    </AuthGuard>
  );
}
