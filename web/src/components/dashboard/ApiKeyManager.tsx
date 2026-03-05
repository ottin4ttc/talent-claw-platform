"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useApiKeys, useCreateApiKey, useDeleteApiKey } from "@/hooks/useApiKeys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ApiKeyManager() {
  const t = useTranslations("dashboard");
  const { data } = useApiKeys();
  const createMutation = useCreateApiKey();
  const deleteMutation = useDeleteApiKey();

  const [openCreate, setOpenCreate] = useState(false);
  const [openCreated, setOpenCreated] = useState(false);
  const [name, setName] = useState("");
  const [createdKey, setCreatedKey] = useState<string>("");

  const create = async () => {
    if (!name.trim()) return;
    const created = await createMutation.mutateAsync({ name });
    setCreatedKey(created.key || "");
    setOpenCreate(false);
    setOpenCreated(true);
    setName("");
  };

  const copyKey = async () => {
    await navigator.clipboard.writeText(createdKey);
    toast.success("Copied");
  };

  return (
    <div className="space-y-3">
      <Button onClick={() => setOpenCreate(true)}>{t("createKey")}</Button>

      {data?.items.map((key) => (
        <Card key={key.id}>
          <CardContent className="flex items-center justify-between pt-6">
            <div className="font-mono text-sm">{key.key_prefix}... · {key.name}</div>
            <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(key.id)}>
              Delete
            </Button>
          </CardContent>
        </Card>
      ))}

      <Dialog open={openCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("createKey")}</DialogTitle>
          </DialogHeader>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("keyName")} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button onClick={create}>Create</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openCreated}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("keyCreated")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("keyWarning")}</p>
          <Input value={createdKey} readOnly />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenCreated(false)}>Close</Button>
            <Button onClick={copyKey}>Copy</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
