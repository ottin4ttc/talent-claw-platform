"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ClawSearch } from "@/components/market/ClawSearch";
import { ClawCard } from "@/components/market/ClawCard";
import { useClawList } from "@/hooks/useClaws";
import type { ClawSearchParams } from "@/types";
import { Button } from "@/components/ui/button";

export default function MarketPage() {
  const t = useTranslations("market");
  const [params, setParams] = useState<ClawSearchParams>({ page_size: 12 });
  const query = useClawList(params);

  const claws = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data]
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">{t("title")}</h1>

      <ClawSearch
        onSearch={(q) => setParams((p) => ({ ...p, q }))}
        onTagClick={(tag) => setParams((p) => ({ ...p, tags: tag }))}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {claws.map((claw) => (
          <ClawCard key={claw.id} claw={claw} />
        ))}
      </div>

      {query.hasNextPage && (
        <div className="mt-8 flex justify-center">
          <Button onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>
            {t("loadMore")}
          </Button>
        </div>
      )}
    </main>
  );
}
