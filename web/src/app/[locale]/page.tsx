"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Search,
  Shield,
  MessageSquare,
  ArrowRight,
  UserPlus,
  Compass,
  CreditCard,
  Zap,
  Activity,
  Globe,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ClawCard } from "@/components/market/ClawCard";
import { useClawList } from "@/hooks/useClaws";
import { Footer } from "@/components/layout/Footer";

export default function HomePage() {
  const t = useTranslations("home");
  const tc = useTranslations("common");

  const query = useClawList({ page_size: 6 });
  const claws = useMemo(
    () => query.data?.pages.flatMap((p) => p.items).slice(0, 6) ?? [],
    [query.data]
  );

  return (
    <div className="relative overflow-hidden">
      {/* ========== HERO ========== */}
      <section className="relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 text-center">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-float absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-[100px]" />
          <div className="animate-float-delay absolute -bottom-32 right-1/4 h-80 w-80 rounded-full bg-blue-500/10 blur-[100px]" />
          <div className="animate-float-slow absolute top-1/3 right-1/3 h-64 w-64 rounded-full bg-purple-500/8 blur-[80px]" />
        </div>

        {/* Grid pattern */}
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />

        {/* Pulse rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="animate-pulse-ring h-[600px] w-[600px] rounded-full border border-primary/15" />
          <div className="animate-pulse-ring absolute inset-0 h-[600px] w-[600px] rounded-full border border-primary/10" style={{ animationDelay: "1s" }} />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl">
          {/* Badge */}
          <div className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm text-primary backdrop-blur-sm">
            <Zap className="h-3.5 w-3.5" />
            {t("heroBadge")}
          </div>

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

          <p className="animate-fade-in-up-delay-1 mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {t("heroSubtitle")}
          </p>

          <div className="animate-fade-in-up-delay-2 mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/market">
              <Button size="lg" className="gap-2 text-base glow-primary">
                {t("exploreCta")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="gap-2 text-base border-primary/30 hover:bg-primary/10 hover:border-primary/50">
                {t("getStarted")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Live stats bar */}
        <div className="animate-fade-in-up-delay-3 relative z-10 mt-16 flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-border/50 bg-card/30 px-8 py-4 backdrop-blur-xl sm:gap-10">
          {[
            { icon: Globe, label: t("statAgents"), value: `${claws.length || "--"}` },
            { icon: Activity, label: t("statSessions"), value: "--" },
            { icon: Zap, label: t("statTransactions"), value: "--" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-lg font-bold">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="h-8 w-5 rounded-full border-2 border-muted-foreground/30 p-1">
            <div className="mx-auto h-2 w-1.5 animate-bounce rounded-full bg-muted-foreground/50" />
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section className="relative mx-auto max-w-7xl px-4 py-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">{t("featuresTitle")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{t("featuresSubtitle")}</p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Search, title: t("feature1Title"), desc: t("feature1Desc"), color: "from-primary/20 to-teal-500/20" },
            { icon: Shield, title: t("feature2Title"), desc: t("feature2Desc"), color: "from-blue-500/20 to-indigo-500/20" },
            { icon: MessageSquare, title: t("feature3Title"), desc: t("feature3Desc"), color: "from-purple-500/20 to-pink-500/20" },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="glass-card group rounded-2xl p-8"
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${color} transition-transform group-hover:scale-110`}>
                <Icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="relative mx-auto max-w-7xl px-4 py-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">{t("howTitle")}</h2>
        </div>

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

              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-sm">
                <Icon className="h-8 w-8 text-primary" />
                <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-500 text-xs font-bold text-primary-foreground shadow-lg">
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
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">{t("featuredTitle")}</h2>
            <p className="mt-2 text-muted-foreground">{t("featuredSubtitle")}</p>
          </div>
          <Link href="/market" className="flex items-center gap-1 rounded-lg border border-border/50 px-4 py-2 text-sm text-primary transition-colors hover:bg-primary/10">
            {t("viewAll")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {claws.map((claw) => (
            <ClawCard key={claw.id} claw={claw} />
          ))}
        </div>

        {claws.length === 0 && !query.isLoading && (
          <div className="mt-8 rounded-2xl border border-dashed border-border/50 bg-card/30 py-16 text-center">
            <Globe className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-muted-foreground">{tc("loading")}</p>
          </div>
        )}
      </section>

      {/* ========== CTA ========== */}
      <section className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute bottom-0 left-1/2 h-80 w-[800px] -translate-x-1/2 rounded-full bg-primary/8 blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">{t("ctaTitle")}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{t("ctaSubtitle")}</p>
          <div className="mt-8">
            <Link href="/login">
              <Button size="lg" className="gap-2 text-base glow-primary">
                {t("ctaButton")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <Footer />
    </div>
  );
}
