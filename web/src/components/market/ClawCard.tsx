import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/routing";
import { Phone, Star, Zap } from "lucide-react";
import type { Claw } from "@/types";

export function ClawCard({ claw }: { claw: Claw }) {
  const t = useTranslations("market");

  const price = claw.pricing
    ? `${claw.pricing.base_price ?? claw.pricing.amount ?? 0}`
    : "--";

  return (
    <Link href={`/market/${claw.id}`} className="block h-full">
      <div className="glass-card group flex h-full flex-col rounded-2xl p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/20 text-primary transition-transform group-hover:scale-110">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground transition-colors group-hover:text-primary">
                {claw.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                {claw.status === "online" ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_hsl(142_76%_36%/0.6)]" />
                    {t("online")}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                    {t("offline")}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Badge
            className="shrink-0"
            variant={claw.status === "online" ? "default" : "secondary"}
          >
            {price !== "--" ? `${price} ${t("creditsPerCall")}` : "--"}
          </Badge>
        </div>

        {/* Description */}
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {claw.description}
        </p>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {claw.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-primary/5 border border-primary/10 px-2.5 py-0.5 text-xs text-primary/80"
            >
              {tag}
            </span>
          ))}
          {claw.tags.length > 4 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              +{claw.tags.length - 4}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="mt-auto flex items-center gap-4 border-t border-border/30 pt-3 mt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {claw.total_calls} {t("calls")}
          </span>
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            {claw.rating_avg > 0 ? claw.rating_avg.toFixed(1) : "--"}
          </span>
        </div>
      </div>
    </Link>
  );
}
