"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/authStore";
import { Link } from "@/i18n/routing";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { LocaleSwitcher } from "@/components/common/LocaleSwitcher";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  LogOut,
  Settings,
  Receipt,
  Shield,
  User,
  Menu,
  X,
  Store,
  Home,
} from "lucide-react";

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
        className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-sm font-medium transition-all hover:bg-primary/10 hover:border-primary/50 active:scale-[0.97]"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
          <User className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="max-w-[100px] truncate">{user?.nickname || user?.phone}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-border bg-card shadow-xl shadow-black/20 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="border-b border-border/60 px-4 py-3">
            <p className="text-sm font-medium">{user?.nickname || user?.phone}</p>
            <p className="text-xs text-muted-foreground">{user?.phone}</p>
          </div>
          <div className="py-1">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-primary/10 hover:text-primary"
            >
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              {t("dashboard")}
            </Link>
            <Link
              href="/transactions"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-primary/10 hover:text-primary"
            >
              <Receipt className="h-4 w-4 text-muted-foreground" />
              {t("transactions")}
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-primary/10 hover:text-primary"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              {t("settings")}
            </Link>
            {isAdmin && (
              <Link
                href="/admin/sessions"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-primary/10 hover:text-primary"
              >
                <Shield className="h-4 w-4 text-muted-foreground" />
                {tAdmin("title")}
              </Link>
            )}
          </div>
          <div className="border-t border-border/60 py-1">
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
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
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-lg font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-500 text-primary-foreground">
              <span className="text-sm font-black">TC</span>
            </div>
            <span className="text-primary font-bold">
              {t("appName")}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            >
              <Home className="h-4 w-4" />
              {t("home")}
            </Link>
            <Link
              href="/market"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            >
              <Store className="h-4 w-4" />
              {t("market")}
            </Link>
          </nav>

          {/* Desktop right */}
          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            <LocaleSwitcher />
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <Link href="/login">
                <Button size="sm" className="gap-1.5">
                  {t("login")}
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 transition-colors hover:bg-muted md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute right-0 top-0 flex h-full w-72 flex-col border-l border-border bg-background animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-border/50 px-4 py-4">
              <span className="text-sm font-semibold text-muted-foreground">Menu</span>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-muted"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 p-3">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors hover:bg-primary/10 hover:text-primary"
              >
                <Home className="h-4 w-4 text-muted-foreground" />
                {t("home")}
              </Link>
              <Link
                href="/market"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors hover:bg-primary/10 hover:text-primary"
              >
                <Store className="h-4 w-4 text-muted-foreground" />
                {t("market")}
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                    {t("dashboard")}
                  </Link>
                  <Link
                    href="/transactions"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    {t("transactions")}
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    {t("settings")}
                  </Link>
                </>
              )}
            </nav>

            <div className="border-t border-border/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <LocaleSwitcher />
              </div>
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    useAuthStore.getState().logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  {t("logout")}
                </button>
              ) : (
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">{t("login")}</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
