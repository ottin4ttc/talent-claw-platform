"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useCurrentUser } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/authStore";
import { getToken } from "@/lib/auth";
import { useRouter } from "@/i18n/routing";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const t = useTranslations("admin");
  const token = getToken();
  const router = useRouter();
  const { isLoading } = useCurrentUser();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!token) {
      router.push("/admin/login");
    }
  }, [token, router]);

  if (!token) return null;
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  }

  if (user && user.role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        {t("accessDenied")}
      </div>
    );
  }

  return <>{children}</>;
}
