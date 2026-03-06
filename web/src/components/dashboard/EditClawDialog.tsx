"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useUpdateClaw } from "@/hooks/useClaws";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Claw } from "@/types";

interface EditClawDialogProps {
  claw: Claw | null;
  open: boolean;
  onClose: () => void;
}

export function EditClawDialog({ claw, open, onClose }: EditClawDialogProps) {
  const t = useTranslations("dashboard");
  const updateMutation = useUpdateClaw();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [pricingModel, setPricingModel] = useState("per_call");
  const [pricingAmount, setPricingAmount] = useState("");
  const [pricingDesc, setPricingDesc] = useState("");

  useEffect(() => {
    if (claw) {
      setName(claw.name);
      setDescription(claw.description);
      setTags(claw.tags?.join(", ") || "");
      setPricingModel(claw.pricing?.model || "per_call");
      setPricingAmount((claw.pricing?.base_price ?? claw.pricing?.amount)?.toString() || "");
      setPricingDesc(claw.pricing?.description || "");
    }
  }, [claw]);

  const handleSave = async () => {
    if (!claw || !name.trim()) return;
    const parsedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const amount = parseFloat(pricingAmount);

    await updateMutation.mutateAsync({
      id: claw.id,
      data: {
        name: name.trim(),
        description: description.trim(),
        tags: parsedTags,
        pricing: {
          model: pricingModel,
          amount: isNaN(amount) ? 0 : amount,
          description: pricingDesc.trim() || undefined,
        },
      },
    });
    toast.success(t("saveClaw"));
    onClose();
  };

  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("editClaw")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">{t("clawName")}</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t("clawDescription")}</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t("clawTags")}</label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="nlp, translate, ..." />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t("pricingModel")}</label>
            <Select value={pricingModel} onChange={(e) => setPricingModel(e.target.value)}>
              <option value="per_call">{t("perCall")}</option>
              <option value="negotiable">{t("negotiable")}</option>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t("pricingAmount")}</label>
            <Input type="number" value={pricingAmount} onChange={(e) => setPricingAmount(e.target.value)} min="0" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t("pricingDesc")}</label>
            <Input value={pricingDesc} onChange={(e) => setPricingDesc(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>{t("saveClaw")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
