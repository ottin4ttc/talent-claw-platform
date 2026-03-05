"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMyClaws, useUpdateClaw } from "@/hooks/useClaws";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { EditClawDialog } from "./EditClawDialog";
import type { Claw } from "@/types";

export function MyClawList() {
  const t = useTranslations("dashboard");
  const { data, isLoading, error } = useMyClaws();
  const updateMutation = useUpdateClaw();
  const [editingClaw, setEditingClaw] = useState<Claw | null>(null);

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

  const toggleStatus = (claw: Claw) => {
    const newStatus = claw.status === "online" ? "offline" : "online";
    updateMutation.mutate({ id: claw.id, data: { status: newStatus } });
  };

  return (
    <div className="space-y-3">
      {data?.items?.map((claw) => (
        <Card key={claw.id}>
          <CardContent className="flex items-center justify-between pt-6">
            <div className="flex-1">
              <div className="font-medium">{claw.name}</div>
              <div className="text-sm text-muted-foreground">{claw.total_calls} calls</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {claw.status === "online" ? t("online") : t("offline")}
              </span>
              <Switch
                checked={claw.status === "online"}
                onCheckedChange={() => toggleStatus(claw)}
                disabled={updateMutation.isPending}
              />
              <Button variant="outline" size="sm" onClick={() => setEditingClaw(claw)}>
                {t("editClaw")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <p className="text-xs text-muted-foreground">{t("clawApiNotice")}</p>

      <EditClawDialog
        claw={editingClaw}
        open={!!editingClaw}
        onClose={() => setEditingClaw(null)}
      />
    </div>
  );
}
