"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Eye, EyeOff, Copy, Trash2 } from "lucide-react";
import { useApiKeys, useCreateApiKey, useDeleteApiKey } from "@/hooks/useApiKeys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function maskKey(key: string) {
  if (key.length <= 12) return key + "****";
  return key.slice(0, 8) + "****" + key.slice(-4);
}

export function ApiKeyManager() {
  const t = useTranslations("dashboard");
  const { data } = useApiKeys();
  const createMutation = useCreateApiKey();
  const deleteMutation = useDeleteApiKey();

  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState("");
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const create = async () => {
    if (!name.trim()) return;
    await createMutation.mutateAsync({ name });
    setOpenCreate(false);
    setName("");
  };

  const toggleVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    toast.success("Copied");
  };

  return (
    <div className="space-y-3">
      <Button onClick={() => setOpenCreate(true)}>{t("createKey")}</Button>

      {data?.items?.map((key) => {
        const fullKey = key.key_full || key.key || "";
        const isVisible = visibleKeys.has(key.id);

        return (
          <Card key={key.id}>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground mb-1">{key.name}</div>
                <div className="font-mono text-sm truncate">
                  {fullKey ? (isVisible ? fullKey : maskKey(fullKey)) : `${key.key_prefix}****`}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {fullKey && (
                  <>
                    <Button variant="ghost" size="sm" className="h-8 w-8" onClick={() => toggleVisibility(key.id)}>
                      {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8" onClick={() => copyKey(fullKey)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="sm" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(key.id)} disabled={deleteMutation.isPending}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={openCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("createKey")}</DialogTitle>
          </DialogHeader>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("keyName")} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button onClick={create} loading={createMutation.isPending}>Create</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
