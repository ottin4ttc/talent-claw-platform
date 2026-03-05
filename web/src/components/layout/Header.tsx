"use client";

import { useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/authStore";
import { Link } from "@/i18n/routing";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { LocaleSwitcher } from "@/components/common/LocaleSwitcher";
import { Button } from "@/components/ui/button";

export function Header() {
  const t = useTranslations("common");
  const tAdmin = useTranslations("admin");
  const { isAuthenticated, user, logout } = useAuthStore();
  const isAdmin = user?.role === "admin";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/70 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/market" className="text-lg font-bold text-primary">
          {t("appName")}
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link href="/market" className="text-foreground hover:text-primary transition-colors">
            {t("market")}
          </Link>
          {isAuthenticated && (
            <>
              <Link href="/dashboard" className="text-foreground hover:text-primary transition-colors">
                {t("dashboard")}
              </Link>
              <Link href="/transactions" className="text-foreground hover:text-primary transition-colors">
                {t("transactions")}
              </Link>
              <Link href="/settings" className="text-foreground hover:text-primary transition-colors">
                {t("settings")}
              </Link>
              {isAdmin && (
                <Link href="/admin/sessions" className="text-foreground hover:text-primary transition-colors">
                  {tAdmin("title")}
                </Link>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LocaleSwitcher />
          {isAuthenticated ? (
            <Button variant="ghost" size="sm" onClick={logout}>
              {user?.nickname || t("logout")}
            </Button>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm">{t("login")}</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
