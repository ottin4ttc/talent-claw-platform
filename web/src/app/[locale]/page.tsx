"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Search, Shield, MessageSquare, ArrowRight, UserPlus, Compass, CreditCard } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ClawCard } from "@/components/market/ClawCard";
import { useClawList } from "@/hooks/useClaws";

export default function HomePage() {
  const t = useTranslations("home");
  const tc = useTranslations("common");

  const query = useClawList({ page_size: 3 });
  const claws = useMemo(
    () => query.data?.pages.flatMap((p) => p.items).slice(0, 3) ?? [],
    [query.data]
  );

  return (
    <div className="relative overflow-hidden">
      {/* ========== HERO ========== */}
      <section className="relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 text-center">
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-float absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="animate-float-delay absolute -bottom-20 right-1/4 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="animate-float-slow absolute top-1/3 right-1/3 h-48 w-48 rounded-full bg-primary/10 blur-2xl" />
        </div>

        {/* Pulse ring behind title */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="animate-pulse-ring h-[500px] w-[500px] rounded-full border border-primary/20" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl">
          <h1 className="animate-fade-in-up text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-primary via-teal-400 to-blue-500 bg-clip-text text-transparent">
              {t("heroTitle").split("\n").map((line, i) => (
                <span key={i}>
                  {line}
                  {i === 0 && <br />}
                </span>
              ))}
            </span>
          </h1>

          <p className="animate-fade-in-up-delay-1 mx-auto mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl">
            {t("heroSubtitle")}
          </p>

          <div className="animate-fade-in-up-delay-2 mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/market">
              <Button size="lg" className="gap-2 text-base">
                {t("exploreCta")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="text-base">
                {t("getStarted")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="h-8 w-5 rounded-full border-2 border-muted-foreground/30 p-1">
            <div className="mx-auto h-2 w-1.5 animate-bounce rounded-full bg-muted-foreground/50" />
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section className="mx-auto max-w-7xl px-4 py-24">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">{t("featuresTitle")}</h2>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Search, title: t("feature1Title"), desc: t("feature1Desc") },
            { icon: Shield, title: t("feature2Title"), desc: t("feature2Desc") },
            { icon: MessageSquare, title: t("feature3Title"), desc: t("feature3Desc") },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group relative rounded-xl border border-border bg-card p-8 shadow-sm transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="relative mx-auto max-w-7xl px-4 py-24">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">{t("howTitle")}</h2>

        <div className="mt-16 grid gap-12 sm:grid-cols-3 sm:gap-8">
          {[
            { icon: UserPlus, num: "01", title: t("step1Title"), desc: t("step1Desc") },
            { icon: Compass, num: "02", title: t("step2Title"), desc: t("step2Desc") },
            { icon: CreditCard, num: "03", title: t("step3Title"), desc: t("step3Desc") },
          ].map(({ icon: Icon, num, title, desc }, idx) => (
            <div key={num} className="relative flex flex-col items-center text-center">
              {/* Connector line */}
              {idx < 2 && (
                <div className="absolute top-10 left-[calc(50%+40px)] hidden h-px w-[calc(100%-80px)] bg-gradient-to-r from-primary/40 to-primary/10 sm:block" />
              )}

              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/30 bg-primary/5">
                <Icon className="h-8 w-8 text-primary" />
                <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {num}
                </span>
              </div>
              <h3 className="mt-6 text-lg font-semibold">{title}</h3>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========== FEATURED CLAWS ========== */}
      <section className="mx-auto max-w-7xl px-4 py-24">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold sm:text-4xl">{t("featuredTitle")}</h2>
          <Link href="/market" className="flex items-center gap-1 text-sm text-primary hover:underline">
            {t("viewAll")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {claws.map((claw) => (
            <ClawCard key={claw.id} claw={claw} />
          ))}
        </div>

        {claws.length === 0 && !query.isLoading && (
          <p className="mt-8 text-center text-muted-foreground">{tc("loading")}</p>
        )}
      </section>

      {/* ========== CTA FOOTER ========== */}
      <section className="relative overflow-hidden border-t border-border py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute bottom-0 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">{t("ctaTitle")}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{t("ctaSubtitle")}</p>
          <div className="mt-8">
            <Link href="/login">
              <Button size="lg" className="gap-2 text-base">
                {t("ctaButton")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <p className="mt-16 text-center text-xs text-muted-foreground/50">
          &copy; {new Date().getFullYear()} {t("copyright")}
        </p>
      </section>
    </div>
  );
}
