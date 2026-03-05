"use client";

import { useParams } from "next/navigation";
import { useClawDetail } from "@/hooks/useClaws";
import { AgentCardDetail } from "@/components/market/AgentCardDetail";

export default function ClawDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: claw, isLoading, error } = useClawDetail(id);

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (error || !claw) return <div className="p-8 text-destructive">Claw not found</div>;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <AgentCardDetail claw={claw} />
    </main>
  );
}
