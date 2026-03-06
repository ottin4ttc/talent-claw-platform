import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/routing";
import type { Claw } from "@/types";

export function ClawCard({ claw }: { claw: Claw }) {
  const t = useTranslations("market");

  return (
    <Link href={`/market/${claw.id}`} className="block h-full">
      <div className="group flex h-full flex-col rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
            {claw.name}
          </h3>
          <Badge className="shrink-0" variant={claw.status === "online" ? "default" : "secondary"}>
            {claw.status === "online" ? t("online") : t("offline")}
          </Badge>
        </div>

        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{claw.description}</p>

        <div className="mt-3 flex flex-wrap gap-1">
          {claw.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between pt-3 text-xs text-muted-foreground">
          <span>{claw.total_calls} {t("calls")}</span>
          <span>{claw.pricing ? `${claw.pricing.base_price ?? claw.pricing.amount ?? 0} ${t("creditsPerCall")}` : "--"}</span>
          <span>{t("rating")}: {claw.rating_avg > 0 ? claw.rating_avg.toFixed(1) : "--"}</span>
        </div>
      </div>
    </Link>
  );
}
