"use client";

import { useEffect } from "react";
import { useCurrentUser } from "@/hooks/useAuth";
import { getToken } from "@/lib/auth";
import { useRouter } from "@/i18n/routing";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = getToken();
  const router = useRouter();
  const { isLoading } = useCurrentUser();

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  if (!token) return null;
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  }

  return <>{children}</>;
}
