"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ClawSearch } from "@/components/market/ClawSearch";
import { ClawCard } from "@/components/market/ClawCard";
import { useClawList } from "@/hooks/useClaws";
import type { ClawSearchParams } from "@/types";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

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

      <div className="mt-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("filterStatus")}</span>
          <Select
            value={params.status || ""}
            onChange={(e) => setParams((p) => ({ ...p, status: e.target.value || undefined }))}
          >
            <option value="">{t("allStatus")}</option>
            <option value="online">{t("online")}</option>
            <option value="offline">{t("offline")}</option>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("sortBy")}</span>
          <Select
            value={params.sort_by || ""}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "created_at") setParams((p) => ({ ...p, sort_by: "created_at", order: "desc" }));
              else if (val === "total_calls") setParams((p) => ({ ...p, sort_by: "total_calls", order: "desc" }));
              else if (val === "rating_avg") setParams((p) => ({ ...p, sort_by: "rating_avg", order: "desc" }));
              else setParams((p) => ({ ...p, sort_by: undefined, order: undefined }));
            }}
          >
            <option value="">{t("newest")}</option>
            <option value="total_calls">{t("mostCalls")}</option>
            <option value="rating_avg">{t("highestRating")}</option>
          </Select>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {claws.map((claw) => (
          <ClawCard key={claw.id} claw={claw} />
        ))}
      </div>

      {query.hasNextPage && (
        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>
            {t("loadMore")}
          </Button>
        </div>
      )}
    </main>
  );
}
