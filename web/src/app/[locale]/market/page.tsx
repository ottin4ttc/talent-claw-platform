"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ClawSearch } from "@/components/market/ClawSearch";
import { ClawCard } from "@/components/market/ClawCard";
import { useClawList } from "@/hooks/useClaws";
import type { ClawSearchParams } from "@/types";
import { Button } from "@/components/ui/button";
import { Store, SlidersHorizontal } from "lucide-react";
import { Footer } from "@/components/layout/Footer";

const SORT_OPTIONS = [
  { value: "", labelKey: "newest" },
  { value: "total_calls", labelKey: "mostCalls" },
  { value: "rating_avg", labelKey: "highestRating" },
] as const;

const STATUS_OPTIONS = [
  { value: "", labelKey: "allStatus" },
  { value: "online", labelKey: "online" },
  { value: "offline", labelKey: "offline" },
] as const;

export default function MarketPage() {
  const t = useTranslations("market");
  const [params, setParams] = useState<ClawSearchParams>({ page_size: 12 });
  const [showFilters, setShowFilters] = useState(false);
  const query = useClawList(params);

  const claws = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data]
  );

  const activeSort = params.sort_by || "";
  const activeStatus = params.status || "";

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        {/* Page header */}
        <div className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{t("title")}</h1>
                <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Sidebar filters (desktop) */}
            <aside className="hidden w-64 shrink-0 lg:block">
              <div className="sticky top-20 space-y-6">
                <div className="glass-card rounded-2xl p-5">
                  <h3 className="mb-4 text-sm font-semibold">{t("filterStatus")}</h3>
                  <div className="flex flex-col gap-1">
                    {STATUS_OPTIONS.map(({ value, labelKey }) => (
                      <button
                        key={labelKey}
                        onClick={() => setParams((p) => ({ ...p, status: value || undefined }))}
                        className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          activeStatus === value
                            ? "bg-primary/15 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {t(labelKey)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-5">
                  <h3 className="mb-4 text-sm font-semibold">{t("sortBy")}</h3>
                  <div className="flex flex-col gap-1">
                    {SORT_OPTIONS.map(({ value, labelKey }) => (
                      <button
                        key={labelKey}
                        onClick={() => {
                          if (value) {
                            setParams((p) => ({ ...p, sort_by: value, order: "desc" }));
                          } else {
                            setParams((p) => ({ ...p, sort_by: undefined, order: undefined }));
                          }
                        }}
                        className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          activeSort === value
                            ? "bg-primary/15 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {t(labelKey)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 space-y-6">
              {/* Search + mobile filter toggle */}
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <ClawSearch
                    onSearch={(q) => setParams((p) => ({ ...p, q }))}
                    onTagClick={(tag) => setParams((p) => ({ ...p, tags: tag }))}
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-muted lg:hidden"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
              </div>

              {/* Mobile filters */}
              {showFilters && (
                <div className="glass-card flex flex-wrap gap-2 rounded-2xl p-4 lg:hidden">
                  <div className="w-full mb-2">
                    <span className="text-xs font-medium text-muted-foreground">{t("filterStatus")}</span>
                  </div>
                  {STATUS_OPTIONS.map(({ value, labelKey }) => (
                    <button
                      key={labelKey}
                      onClick={() => setParams((p) => ({ ...p, status: value || undefined }))}
                      className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                        activeStatus === value
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {t(labelKey)}
                    </button>
                  ))}

                  <div className="w-full mt-2 mb-2">
                    <span className="text-xs font-medium text-muted-foreground">{t("sortBy")}</span>
                  </div>
                  {SORT_OPTIONS.map(({ value, labelKey }) => (
                    <button
                      key={labelKey}
                      onClick={() => {
                        if (value) {
                          setParams((p) => ({ ...p, sort_by: value, order: "desc" }));
                        } else {
                          setParams((p) => ({ ...p, sort_by: undefined, order: undefined }));
                        }
                      }}
                      className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                        activeSort === value
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {t(labelKey)}
                    </button>
                  ))}
                </div>
              )}

              {/* Results grid */}
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {claws.map((claw) => (
                  <ClawCard key={claw.id} claw={claw} />
                ))}
              </div>

              {/* Empty state */}
              {claws.length === 0 && !query.isLoading && (
                <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center">
                  <Store className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">{t("noResults")}</p>
                </div>
              )}

              {/* Load more */}
              {query.hasNextPage && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => query.fetchNextPage()}
                    disabled={query.isFetchingNextPage}
                    className="rounded-xl border-border/50"
                  >
                    {t("loadMore")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
