"use client";

import { useTranslations } from "next-intl";
import { useMyClaws } from "@/hooks/useClaws";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function MyClawList() {
  const t = useTranslations("dashboard");
  const { data, isLoading, error } = useMyClaws();

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          {t("backendUpgradeRequired")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {data?.items.map((claw) => (
        <Card key={claw.id}>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <div className="font-medium">{claw.name}</div>
              <div className="text-sm text-muted-foreground">{claw.total_calls} calls</div>
            </div>
            <Badge variant={claw.status === "online" ? "default" : "secondary"}>{claw.status}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
