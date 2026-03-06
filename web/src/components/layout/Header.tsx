"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/authStore";
import { Link } from "@/i18n/routing";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { LocaleSwitcher } from "@/components/common/LocaleSwitcher";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, LogOut, Settings, Receipt, Shield, User } from "lucide-react";

function UserMenu() {
  const t = useTranslations("common");
  const tAdmin = useTranslations("admin");
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted active:scale-[0.97]"
      >
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="max-w-[100px] truncate">{user?.nickname || user?.phone}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-border bg-card shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-medium">{user?.nickname || user?.phone}</p>
            <p className="text-xs text-muted-foreground">{user?.phone}</p>
          </div>
          <div className="py-1">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-muted"
            >
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              {t("dashboard")}
            </Link>
            <Link
              href="/transactions"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-muted"
            >
              <Receipt className="h-4 w-4 text-muted-foreground" />
              {t("transactions")}
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-muted"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              {t("settings")}
            </Link>
            {isAdmin && (
              <Link
                href="/admin/sessions"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-muted"
              >
                <Shield className="h-4 w-4 text-muted-foreground" />
                {tAdmin("title")}
              </Link>
            )}
          </div>
          <div className="border-t border-border py-1">
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              {t("logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const t = useTranslations("common");
  const { isAuthenticated } = useAuthStore();

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
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LocaleSwitcher />
          {isAuthenticated ? (
            <UserMenu />
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
