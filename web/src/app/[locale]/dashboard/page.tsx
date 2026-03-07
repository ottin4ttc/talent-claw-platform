"use client";

import { useTranslations } from "next-intl";
import { AuthGuard } from "@/components/common/AuthGuard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { MyClawList } from "@/components/dashboard/MyClawList";
import { ApiKeyManager } from "@/components/dashboard/ApiKeyManager";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { LayoutDashboard, Bot, Key } from "lucide-react";
import { Footer } from "@/components/layout/Footer";

export default function DashboardPage() {
  const t = useTranslations("dashboard");

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          {/* Page header */}
          <div className="border-b border-border bg-card">
            <div className="mx-auto max-w-7xl px-4 py-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20">
                  <LayoutDashboard className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{t("title")}</h1>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-4 py-6">
            {/* Stats row */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <BalanceCard />
              <RecentTransactions />
            </div>

            {/* Tabs */}
            <div className="mt-8">
              <Tabs defaultValue="claws">
                <TabsList>
                  <TabsTrigger value="claws" className="gap-1.5">
                    <Bot className="h-4 w-4" />
                    {t("myClaws")}
                  </TabsTrigger>
                  <TabsTrigger value="api-keys" className="gap-1.5">
                    <Key className="h-4 w-4" />
                    {t("apiKeys")}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="claws">
                  <MyClawList />
                </TabsContent>
                <TabsContent value="api-keys">
                  <ApiKeyManager />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );
}
