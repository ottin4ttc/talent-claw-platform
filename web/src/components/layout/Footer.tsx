"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Github, Mail } from "lucide-react";

export function Footer() {
  const t = useTranslations("footer");
  const tc = useTranslations("common");

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-500 text-primary-foreground">
                <span className="text-sm font-black">TC</span>
              </div>
              <span className="text-lg font-bold">{tc("appName")}</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("description")}
            </p>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">{t("product")}</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/market" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                {tc("market")}
              </Link>
              <Link href="/dashboard" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                {tc("dashboard")}
              </Link>
              <Link href="/transactions" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                {tc("transactions")}
              </Link>
            </nav>
          </div>

          {/* Developers */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">{t("developers")}</h4>
            <nav className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">{t("apiDocs")}</span>
              <span className="text-sm text-muted-foreground">{t("sdk")}</span>
              <span className="text-sm text-muted-foreground">{t("examples")}</span>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">{t("contact")}</h4>
            <div className="flex flex-col gap-2">
              <a
                href="mailto:support@talentclaw.com"
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                <Mail className="h-4 w-4" />
                support@talentclaw.com
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Talent Claw Platform. {t("rights")}
          </p>
          <p className="text-xs text-muted-foreground">
            Built by <span className="font-medium">Tis</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
